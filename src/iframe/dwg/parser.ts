/**
 * DWG 解析入口：加载 libredwg wasm，解析 ArrayBuffer，构造 IR（含 BLOCK 展开）。
 *
 * 底层库：@mlightcad/libredwg-web（GPL-3.0）
 *   const libredwg = await LibreDwg.create('<wasm 目录>');
 *   const ptr = libredwg.dwg_read_data(buffer, Dwg_File_Type.DWG);
 *   const db  = libredwg.convert(ptr);   // DwgDatabase
 *
 * 资源加载方式见 resources.ts：不能依赖 import.meta.url 做相对解析
 * （弹窗页面是 blob URL，会抛 Invalid URL），须由 HTML 登记后取回 blob URL。
 *
 * 失败统一抛 Error，message 含上下文，由调用方在界面上呈现。
 */

import type { DwgEntity, DwgIR, DwgPoint } from '../../shared/types';
import type { RawDwgEntity } from './ir';
import { buildBlockDefs, expandInserts } from './block-expander';
import { expandBulgeVertices } from './bulge';
import { clipLineToBox, infiniteLineEndpoints } from './infinite-line';
import { buildIR, computeBoundingBox, detectBestUnit, detectUnits } from './ir';
import { mtextFirstLineOffsetY, mtextLinePitch, splitMTextLines } from './mtext';
import { filterOutlierEntities } from './outlier';
import { vendorModuleUrl, vendorWasmUrl } from './resources';
import { sampleSplineCurve } from './spline-fit';

export interface ParseOptions {
	onProgress?: (percent: number) => void;
	/** 最大实体数；超过则抛错。 */
	maxEntities?: number;
	/** 最大文件字节数。 */
	maxBytes?: number;
	/**
	 * 离群实体过滤（默认开启）。极端缩放的辅助几何会把画布视野拉到看不见图元，
	 * 默认剔除并写解析警告；诊断/对比原始数据时可显式关闭。
	 */
	filterOutliers?: boolean;
}

/** @mlightcad/libredwg-web 的最小结构契约（避免把整个库的类型引入编译单元）。 */
interface Point3D { x: number; y: number; z?: number }

interface DwgEntityLike {
	type: string;
	handle?: string;
	layer?: string;
	colorIndex?: number;
	color?: number;
	lineweight?: number;
	// LINE
	startPoint?: Point3D;
	endPoint?: Point3D;
	// CIRCLE / ARC
	center?: Point3D;
	radius?: number;
	startAngle?: number;
	endAngle?: number;
	// LWPOLYLINE / POLYLINE2D / POLYLINE3D（顶点可带凸度 bulge = tan(θ/4)）
	vertices?: Array<{ x: number; y: number; bulge?: number }>;
	flag?: number;
	constantWidth?: number;
	// POLYLINE2D/3D
	// TEXT
	text?: string;
	startPoint2D?: Point3D;
	textHeight?: number;
	rotation?: number;
	// MTEXT
	insertionPoint?: Point3D;
	// SPLINE
	controlPoints?: Point3D[];
	fitPoints?: Point3D[];
	degree?: number;
	/** SPLINE 节点向量；控制点型样条求值必需（缺了只能退化成拟合点连线）。 */
	knots?: number[];
	/** SPLINE 有理权重（与 controlPoints 等长）。 */
	weights?: number[];
	/** SPLINE 端点切向（拟合点型样条的端导数）。 */
	startTangent?: Point3D;
	endTangent?: Point3D;
	// XLINE / RAY（无限长构造线）
	firstPoint?: Point3D;
	unitDirection?: Point3D;
	// WIPEOUT（遮罩）：位置 + 两个像素向量 + 归一化裁剪边界
	position?: Point3D;
	uPixel?: Point3D;
	vPixel?: Point3D;
	imageSize?: { x: number; y: number };
	clippingBoundaryPath?: Array<{ x: number; y: number }>;
	countBoundaryPoints?: number;
	// MTEXT 折行参数
	rectWidth?: number;
	attachmentPoint?: number;
	lineSpacing?: number;
	// ACAD_TABLE：匿名块名可能缺失，靠 blockRecordHandle 或 *T<n> 命名约定兜底
	blockRecordHandle?: string;
	// INSERT
	name?: string;
	xScale?: number;
	yScale?: number;
	// ATTDEF / ATTRIB
	// SOLID / 3DFACE（四角；DXF 顶点语义见各 case 注释）
	corner1?: Point3D;
	corner2?: Point3D;
	corner3?: Point3D;
	corner4?: Point3D;
	// ELLIPSE
	majorAxisEndPoint?: Point3D;
	axisRatio?: number;
	// 其它
	[key: string]: unknown;
}

interface BlockRecordLike {
	name: string;
	flags?: number;
	entities?: DwgEntityLike[];
}

interface LayerEntryLike {
	name: string;
	colorIndex?: number;
	color?: number;
}

interface DwgDatabaseLike {
	header?: { INSUNITS?: number };
	entities?: DwgEntityLike[];
	tables?: {
		LAYER?: { entries?: LayerEntryLike[] };
		BLOCK_RECORD?: { entries?: BlockRecordLike[] };
	};
}

interface LibreDwgLike {
	/** 解析 DWG 字节流，返回 Dwg_Data 指针。fileType：0=DWG，1=DXF。 */
	dwg_read_data: (content: ArrayBuffer, fileType: number) => unknown;
	/**
	 * 整个数据库转换，返回 `{ database, stats }`。
	 *
	 * 注意不能误用 `convert(ptr)`：那是**单个对象**转换
	 * （内部走 `dwg_object_to_entity`），把库指针喂进去只会得到垃圾数据。
	 */
	convertEx: (data: unknown) => { database: DwgDatabaseLike };
	dwg_free?: (data: unknown) => void;
}

interface LibredwgModule {
	/**
	 * wasm 胶水层的默认导出（合并后仍保留导出）。
	 * 支持通过入参传入 `locateFile` 覆盖 wasm 路径。
	 */
	createModule?: (moduleArg?: Record<string, unknown>) => Promise<unknown>;
	/** ESM 包装层：提供类型转换与 LibreDwg.create 便捷方法。 */
	LibreDwg?: {
		create: (filepath?: string) => Promise<LibreDwgLike>;
		createByWasmInstance: (instance: unknown) => LibreDwgLike;
	};
	Dwg_File_Type?: { DWG: number; DXF: number };
}

const DWG_FILE_TYPE_DWG = 0;

async function loadModule(): Promise<{ libredwg: LibreDwgLike }> {
	// 1. 宿主预挂载（测试 / mock）。
	const fromGlobal = (globalThis as unknown as { __dwg_libredwg__?: LibreDwgLike }).__dwg_libredwg__;
	if (fromGlobal)
		return { libredwg: fromGlobal };

	/*
	 * 2. 取回由 HTML 登记、EDA 改写后的 blob URL。
	 *
	 * 不能用 `new URL('../vendor/...', import.meta.url)`：
	 * 弹窗页面由 blob URL 承载，相对解析会抛 `Invalid URL`（已实测）。
	 * 详见 resources.ts 顶部说明。
	 */
	let moduleUrl: string;
	let wasmUrl: string;
	try {
		moduleUrl = vendorModuleUrl();
		wasmUrl = vendorWasmUrl();
	}
	catch (err) {
		throw new Error(`解析引擎资源缺失：${(err as Error).message}`);
	}

	let mod: LibredwgModule;
	try {
		mod = (await import(/* @vite-ignore */ moduleUrl)) as unknown as LibredwgModule;
	}
	catch (err) {
		throw new Error(`加载解析引擎失败：${(err as Error).message}`);
	}

	/*
	 * 3. 指定 wasm 并实例化。
	 *
	 * 不用 `LibreDwg.create(filepath)`：它内部会拼 `${filepath}/${filename}`，
	 * 而经 blob 改写后的 wasm 是独立 blob URL（无可用目录概念）。
	 * 故直接用胶水层的 createModule，通过 locateFile 精确返回该 URL。
	 */
	const createModule = mod.createModule;
	if (!createModule || !mod.LibreDwg)
		throw new Error('解析引擎导出异常（缺少 createModule 或 LibreDwg）');

	try {
		const wasmInstance = await createModule({
			locateFile: (filename: string) => (filename.endsWith('.wasm') ? wasmUrl : filename),
		});
		return { libredwg: mod.LibreDwg.createByWasmInstance(wasmInstance) };
	}
	catch (err) {
		throw new Error(`初始化解析引擎失败：${(err as Error).message}`);
	}
}

/** 主解析入口。 */
export async function parseDwg(
	file: File,
	options: ParseOptions = {},
): Promise<DwgIR> {
	if (options.maxBytes && file.size > options.maxBytes) {
		throw new Error(`File too large (>${options.maxBytes} bytes)`);
	}
	const buffer = await file.arrayBuffer();
	options.onProgress?.(10);

	const { libredwg } = await loadModule();
	options.onProgress?.(30);

	let db: DwgDatabaseLike;
	let dataPtr: unknown;
	try {
		dataPtr = libredwg.dwg_read_data(buffer, DWG_FILE_TYPE_DWG);
		if (dataPtr === undefined || dataPtr === null) {
			throw new Error('dwg_read_data returned no data');
		}
		db = libredwg.convertEx(dataPtr).database;
	}
	catch (err) {
		throw new Error(`Parse error: ${(err as Error).message}`);
	}
	finally {
		// 释放 wasm 侧内存；失败不影响已转换出的纯 JS 数据。
		try {
			libredwg.dwg_free?.(dataPtr);
		}
		catch {
			// 忽略：dwg_free 内部已自带 dwg_abandon 兜底
		}
	}
	options.onProgress?.(70);

	const modelEntities = db.entities ?? [];
	if (options.maxEntities && modelEntities.length > options.maxEntities) {
		throw new Error(`Too many entities (>${options.maxEntities})`);
	}

	/*
	 * BLOCK 定义：BLOCK_RECORD 表每一项带 entities。
	 *
	 * 过滤规则：
	 * - `*Model_Space` / `*Paper_Space*` 是布局容器而非可复用块，
	 *   其 entities 与顶层模型空间实体重复，若当作块会污染预览里的块列表；
	 * - flags bit2（值 4）为 XREF 外部参照，跨文件无法解析；
	 * - 空块没有展开价值。
	 */
	const blockEntries = db.tables?.BLOCK_RECORD?.entries ?? [];

	/*
	 * 转换上下文（见 ToRawContext 注释）。
	 * `tableBlocks` 单独预扫一遍：表格可能出现在模型空间（正常情况）也可能在块里，
	 * 预扫后与遍历顺序无关，且只收「真正会进入 blockDefs 的块」（非布局、非 XREF、非空）。
	 */
	const ctx: ToRawContext = { tableBlocks: [], dimBlocks: [], blockAttrTags: [], notes: [], skipped: new Map<string, number>() };
	for (const b of blockEntries) {
		const isLayout = /^\*(?:Model|Paper)_Space/i.test(b.name);
		const isXref = typeof b.flags === 'number' && (b.flags & 4) !== 0;
		if (isLayout || isXref || (b.entities ?? []).length === 0)
			continue;
		if (/^\*T\d*$/i.test(b.name))
			ctx.tableBlocks.push(b.name);
		else if (/^\*D\d*$/i.test(b.name))
			ctx.dimBlocks.push(b);
	}

	/*
	 * 标注匿名块（*D）兜底：重新保存过的图纸里 DIMENSION 的块名会整体丢失
	 * （实测 10 条标注 name 全为 undefined），而块本身还在。标注块的几何已经
	 * 是 WCS，实测 textPoint 距对应块几何 0~2.7 单位、离其他块数百到数千单位，
	 * 故按「最近的未占用标注块」匹配——同时给重名的匿名块补唯一后缀，否则
	 * 块定义会互相覆盖（10 个块全叫 `*D`）。
	 */
	assignDimensionBlocks(db.entities, ctx);

	/*
	 * 无名块引用兜底：重新保存过的图纸里 INSERT 的块名会被解析库读成空串
	 * （实测 9 个 INSERT name 全为 ""，且没有 blockRecordHandle 可回退）。
	 * 这里只做**可靠匹配**——INSERT 带属性、且某个块的 ATTDEF 标记能唯一命中
	 * 它，才认领（本次即 bloko）。其余一律不动并计入警告，绝不按顺序猜配。
	 */
	collectBlockAttrTags(blockEntries, ctx);
	assignInsertBlocks(db.entities, ctx);
	autoAssignRemainingInserts(db.entities, ctx);

	const blockDefsRaw: Array<{ name: string; entities: RawDwgEntity[] }> = [];
	for (const b of blockEntries) {
		const isLayout = /^\*(?:Model|Paper)_Space/i.test(b.name);
		const isXref = typeof b.flags === 'number' && (b.flags & 4) !== 0;
		const entityList = b.entities ?? [];
		if (isLayout || isXref || entityList.length === 0)
			continue;
		const converted: RawDwgEntity[] = [];
		for (const e of entityList) {
			/*
			 * 块内的 ATTDEF/ATTRIB 只是模板：CAD 实际显示的是 INSERT 上的属性值
			 * （模型空间的 ATTRIB 实体，见 toRaw 的 ATTDEF/ATTRIB 分支）。
			 * 这里一并导入会在同一位置渲染两遍文字。
			 */
			if (/^(?:ATTDEF|ATTRIB)$/i.test(e.type))
				continue;
			const r = toRaw(e, ctx);
			if (Array.isArray(r))
				converted.push(...r);
			else if (r)
				converted.push(r);
		}
		blockDefsRaw.push({ name: b.name, entities: converted });
	}

	// 模型空间实体 → RawDwgEntity（含 INSERT）
	const rawEntities: RawDwgEntity[] = [];
	for (const e of modelEntities) {
		const r = toRaw(e, ctx);
		if (Array.isArray(r))
			rawEntities.push(...r);
		else if (r)
			rawEntities.push(r);
	}

	const blockDefs = buildBlockDefs(blockDefsRaw);
	const expanded = expandInserts(rawEntities, blockDefs);

	/*
	 * 构造线裁剪：XLINE/RAY 带的是「基点 + 方向」（长度无限），
	 * 展开拿到最终坐标后裁到图纸实际范围；不裁就会横贯画布并撑爆视野。
	 */
	const lineClip = clipInfiniteEntities(expanded.entities);

	/*
	 * MTEXT 分行：EDA 文本图元是单行的，多行文本必须拆成多个文本实体，
	 * 否则整串（含 `\P`）挤在一行里——用户反馈的「多行文本没有准确换行显示」。
	 */
	const textExpanded = expandMultiLineText(lineClip.entities);
	options.onProgress?.(90);

	/*
	 * 离群过滤：极端缩放的辅助几何（如 xScale 数千倍的块引用）会把整体范围
	 * 拉到主体 hundreds 倍，导入后 zoomToAllPrimitives 的视野随之爆炸，
	 * 用户只看到「标尺巨大、什么都看不见」。默认剔除并写警告。
	 * IR.bbox / 图层计数 / 尺寸行都以过滤后的实体为准。
	 */
	const { kept, outliers, threshold } = options.filterOutliers === false
		? { kept: textExpanded, outliers: [], threshold: null }
		: filterOutlierEntities(textExpanded);
	const finalEntities = kept;

	// 图层统计
	const layerEntries = db.tables?.LAYER?.entries ?? [];
	const counts = new Map<string, number>();
	for (const e of finalEntities) {
		counts.set(e.layer, (counts.get(e.layer) ?? 0) + 1);
	}
	const layers = layerEntries.map(l => ({
		name: l.name,
		color: l.colorIndex ?? l.color ?? 7,
		entityCount: counts.get(l.name) ?? 0,
	}));
	// 兜底：实体引用了但 LAYER 表未列出的图层
	for (const [name, count] of counts) {
		if (!layers.some(l => l.name === name)) {
			layers.push({ name, color: 7, entityCount: count });
		}
	}

	const blocks = blockDefsRaw.map(b => ({ name: b.name, entityCount: b.entities.length }));

	options.onProgress?.(100);

	// 单位检测的告警（未声明/无法识别的 INSUNITS）与离群剔除告警并入解析警告。
	const parseWarnings = [...expanded.warnings, ...lineClip.warnings];
	const skippedWarning = describeSkippedEntities(ctx.skipped);
	if (skippedWarning)
		parseWarnings.push(skippedWarning);
	parseWarnings.push(...ctx.notes);
	if (outliers.length > 0 && threshold !== null) {
		parseWarnings.push(
			`已跳过 ${outliers.length} 个离群实体（距主体超过 ${Math.round(threshold)} 图纸单位，`
			+ '多为极端缩放的辅助/构造几何）——否则导入后画布视野会被拉到看不见图元',
		);
	}

	/*
	 * 「自动」单位档：先取图纸声明（INSUNITS），再按**实际尺寸**做合理性修正——
	 * 声明 mm 但坐标上万的机械图纸，照声明导入会得到十几米的板子。
	 */
	const autoExtent = computeBoundingBox(finalEntities);
	const units = detectBestUnit(
		detectUnits(db.header?.INSUNITS, parseWarnings),
		{ width: autoExtent.maxX - autoExtent.minX, height: autoExtent.maxY - autoExtent.minY },
		parseWarnings,
	);

	return buildIR({
		units,
		layers,
		blocks,
		entities: finalEntities,
		parseWarnings,
	});
}

/**
 * 实体转换上下文：把「转换单个实体」需要的全局信息集中传递。
 *
 * - `tableBlocks`：表格匿名块（`*T<n>`）候选队列。DWG 里表格的可见几何存放在
 *   匿名块中，而解析库给出的 ACAD_TABLE 实体 **blockRecordHandle 为空、name 未定义**
 *   （实测 case/example_2018.dwg），只剩「命名约定」这一条线索，故按出现顺序认领。
 * - `skipped`：未导入的类型计数。以前 `default: return null` 是**静默丢弃**，
 *   用户只看到「图元少了」，不知道少了什么、为什么少（表格/面域/遮罩就是这种情况）。
 */
interface ToRawContext {
	tableBlocks: string[];
	/** 标注匿名块（`*D`/`*D<n>`）候选：重存后 DIMENSION 的 name 会丢，只能按位置匹配。 */
	dimBlocks: Array<{ name: string; entities?: Array<{ [key: string]: unknown }> }>;
	/** 块名 → 块内 ATTDEF 标记：无名 INSERT 只能靠属性标记唯一命中来认领（不猜）。 */
	blockAttrTags: Array<{ name: string; tags: string[] }>;
	/** 自动判定依据等需要让用户看到的说明（并入解析警告）。 */
	notes: string[];
	skipped: Map<string, number>;
}

/** 把 libredwg-web 的实体对象转换成 RawDwgEntity；不支持的类型返回 null。 */
function toRaw(e: DwgEntityLike, ctx: ToRawContext): RawDwgEntity | RawDwgEntity[] | null {
	const layer = e.layer ?? '0';
	const common = {
		id: e.handle,
		layer,
		color: e.colorIndex,
		lineWidth: typeof e.lineweight === 'number' ? e.lineweight : undefined,
	};

	switch (e.type) {
		case 'LINE':
			return {
				...common,
				kind: 'LINE',
				start: toPoint2D(e.startPoint),
				end: toPoint2D(e.endPoint),
			};
		case 'CIRCLE':
			return {
				...common,
				kind: 'CIRCLE',
				center: toPoint2D(e.center),
				radius: e.radius ?? 0,
			};
		case 'ARC':
			return {
				...common,
				kind: 'ARC',
				center: toPoint2D(e.center),
				radius: e.radius ?? 0,
				startAngle: e.startAngle ?? 0,
				endAngle: (e.startAngle ?? 0) + arcSweepRad(e.startAngle ?? 0, e.endAngle ?? 0),
			};
		case 'LWPOLYLINE': {
			// 闭合位是 512（不是 bit0），实测依据见 isLwPolylineClosed 注释。
			const closed = isLwPolylineClosed(e.flag);
			return {
				...common,
				kind: 'LWPOLYLINE',
				points: expandBulgeVertices(e.vertices ?? [], closed),
				closed,
			};
		}
		case 'POLYLINE2D':
		case 'POLYLINE3D': {
			// 旧式 POLYLINE 的 flag 与 DXF group 70 同构，闭合位是 bit0（与 LWPOLYLINE 不同）。
			const closed = isPolylineClosed(e.flag);
			return {
				...common,
				kind: 'POLYLINE',
				points: expandBulgeVertices(e.vertices ?? [], closed),
				closed,
			};
		}
		case 'SPLINE': {
			/*
			 * 贝塞尔 / B 样条必须**真正求值**再采样成折线。
			 *
			 * 此前是把控制点（或拟合点）直接当成折线顶点——等价于把「控制多边形」
			 * 画出来，曲线段全变成直弦（用户反馈即「贝塞尔曲线需要转多段线拟合」）。
			 * 实测 case/example_2018.dwg：4 条 SPLINE 中拟合点型（knots/controlPoints
			 * 为空、fitPoints 6 个）必须做插值拟合，控制点型则用 de Boor 求值。
			 */
			/*
			 * 闭合标志必须与几何自洽。实测 case/example_2018.dwg 的两条样条
			 * flag=9（bit0 闭合、bit3 平面），但首末拟合点相距 290 / 1700 单位：
			 * 直接按标志闭合会凭空补一条横贯图纸的弦（用户反馈
			 * 「贝塞尔曲线首尾相连了，原文件不需要相连的」）。
			 * 因此只在显式标了周期（bit1），或首末点实际重合时才按闭合处理。
			 */
			const splineFlag = typeof e.flag === 'number' ? e.flag : 0;
			const splineClosed = isSplineClosed(
				splineFlag,
				e.fitPoints?.length ? e.fitPoints : e.controlPoints,
			);
			const sampled = sampleSplineCurve({
				degree: e.degree,
				knots: e.knots,
				controlPoints: (e.controlPoints ?? []).map(p => toPoint2D(p)),
				weights: e.weights,
				fitPoints: (e.fitPoints ?? []).map(p => toPoint2D(p)),
				startTangent: e.startTangent ? toPoint2D(e.startTangent) : undefined,
				endTangent: e.endTangent ? toPoint2D(e.endTangent) : undefined,
				closed: splineClosed,
			});
			if (sampled.length >= 2)
				return { ...common, kind: 'SPLINE', points: sampled, closed: splineClosed };

			/*
			 * 求值失败（数据不足/退化）时退回原始点串：几何位置仍是对的，
			 * 只是弯段变直——比整条曲线消失好，且计数让用户在警告里看到。
			 */
			const fallback = e.fitPoints?.length ? e.fitPoints : e.controlPoints;
			if (!fallback || fallback.length < 2) {
				bumpSkipped(ctx, 'SPLINE(数据不足)');
				return null;
			}
			bumpSkipped(ctx, 'SPLINE(退化为折线)');
			return { ...common, kind: 'SPLINE', points: fallback.map(p => toPoint2D(p)), closed: splineClosed };
		}
		case 'TEXT':
			return {
				...common,
				kind: 'TEXT',
				position: toPoint2D((e.startPoint ?? e.startPoint2D) as Point3D | undefined),
				content: typeof e.text === 'string' ? e.text : '',
				height: e.textHeight ?? 1,
				rotation: e.rotation ?? 0,
			};
		case 'MTEXT':
			return {
				...common,
				kind: 'MTEXT',
				position: toPoint2D(e.insertionPoint),
				content: typeof e.text === 'string' ? e.text : '',
				height: e.textHeight ?? 1,
				rotation: e.rotation ?? 0,
				// 折行参数随实体带到 BLOCK 变换之后，再由 expandMultiLineText 消费。
				rectWidth: e.rectWidth,
				attachmentPoint: e.attachmentPoint,
				lineSpacing: e.lineSpacing,
			};
			/*
		 * ATTDEF / ATTRIB：图块属性的「定义」与「实际值」。
		 *
		 * 实测 libredwg-web 把这两类的可见文本放在**嵌套对象** e.text 里：
		 * 值是 e.text.text，位置 / 字高 / 旋转在 e.text.startPoint / textHeight /
		 * rotation，而实体自身的 insertionPoint 恒为 (0,0)——照它导入会把所有
		 * 属性文字堆在原点。用户反馈的「valoro de la teksto en bloko」「ETIKEDO
		 * 文字丢失」即此。
		 *
		 * ATTDEF 的定义值 libredwg-web 不暴露（实测整库搜不到该值），只有
		 * 「无值 + 位于原点」的纯模板会被跳过；其余退回显示标记 tag。
		 */
		/*
		 * MULTILEADER（MLeader）：可见内容是「引线折线 + 文字」，一条实体要产出
		 * 两个图元（故 toRaw 允许返回数组）。
		 * 实测 libredwg-web：引线顶点在 leaderSections[].leaderLines[].vertices，
		 * 文字在 textContent（含换行与格式码，交给 MTEXT 后处理清理），
		 * 锚点在 planeOrigin（与 lastLeaderLinePoint 重合）；textHeight=4。
		 */
		case 'MULTILEADER': {
			const out: RawDwgEntity[] = [];
			const sections: unknown = e.leaderSections;
			for (const section of Array.isArray(sections) ? sections : []) {
				const rawLines = (section as { leaderLines?: unknown }).leaderLines;
				const lines = Array.isArray(rawLines) ? (rawLines as Array<{ vertices?: Point3D[] }>) : [];
				for (const line of lines) {
					const points = (line.vertices ?? []).map(pt => toPoint2D(pt));
					if (points.length >= 2)
						out.push({ ...common, kind: 'LWPOLYLINE', points, closed: false });
				}
			}
			const content = typeof e.textContent === 'string' ? e.textContent : '';
			const anchor = (e.planeOrigin ?? e.lastLeaderLinePoint) as Point3D | undefined;
			if (content.trim().length > 0) {
				out.push({
					...common,
					kind: 'MTEXT',
					position: toPoint2D(anchor),
					content,
					height: typeof e.textHeight === 'number' ? e.textHeight : 1,
					rotation: typeof e.textRotation === 'number' ? e.textRotation : 0,
				});
			}
			if (out.length === 0) {
				bumpSkipped(ctx, 'MULTILEADER(无可用几何)');
				return null;
			}
			return out;
		}
		case 'ATTDEF':
		case 'ATTRIB': {
			const rec = e.text as {
				text?: string;
				startPoint?: Point3D;
				textHeight?: number;
				rotation?: number;
			} | undefined;
			const tag = (e as { tag?: string }).tag ?? '';
			const hasValue = typeof rec?.text === 'string' && rec.text.trim().length > 0;
			const at = rec?.startPoint;
			const atOrigin = !at || (Math.abs(at.x) < 1e-9 && Math.abs(at.y) < 1e-9);
			if ((e as { isVisible?: boolean }).isVisible === false)
				return null;
			if (!hasValue && (!tag || atOrigin))
				return null;
			return {
				...common,
				kind: 'TEXT',
				position: toPoint2D(at),
				content: hasValue ? rec!.text! : tag,
				height: rec?.textHeight ?? 1,
				rotation: rec?.rotation ?? 0,
			};
		}
		case 'SOLID': {
			/*
			 * SOLID 是实心四边形。注意 DXF 顶点序是 1-2-4-3 之字形
			 * （3、4 相对多边形环绕序互换），按 1-2-3-4 连线会得到蝴蝶结自交。
			 * 这里导入为闭合轮廓（填充语义丢失，形状保留）。
			 */
			return {
				...common,
				kind: 'LWPOLYLINE',
				points: [
					toPoint2D(e.corner1),
					toPoint2D(e.corner2),
					toPoint2D(e.corner4),
					toPoint2D(e.corner3),
				],
				closed: true,
			};
		}
		case '3DFACE':
			// 三维面的四角本身就是环绕序（1-2-3-4），导入为闭合四边形轮廓。
			return {
				...common,
				kind: 'LWPOLYLINE',
				points: [
					toPoint2D(e.corner1),
					toPoint2D(e.corner2),
					toPoint2D(e.corner3),
					toPoint2D(e.corner4),
				],
				closed: true,
			};
		case 'ELLIPSE':
			return sampleEllipse(e, common);
		case 'DIMENSION':
			/*
			 * 标注的可见图形存放在其匿名块（*Dn）里——CAD 渲染标注就是渲染该块。
			 * 块内几何是 WCS 坐标（无需平移），故转成 (0,0) 插入的 INSERT，
			 * 走统一的块展开路径。name 缺失（无块的异常标注）则跳过。
			 *
			 * v1.2.0 前整个 DIMENSION 被跳过，R13 等图纸导入后标注全部消失，
			 * 与 CAD 显示「相差太远」。
			 */
			if (!e.name) {
				bumpSkipped(ctx, 'DIMENSION(无匿名块)');
				return null;
			}
			return {
				...common,
				kind: 'INSERT',
				blockName: e.name,
				tx: 0,
				ty: 0,
				sx: 1,
				sy: 1,
				rotation: 0,
				mirror: false,
			};
		case 'INSERT':
			return {
				...common,
				kind: 'INSERT',
				blockName: e.name ?? '',
				tx: e.insertionPoint?.x ?? 0,
				ty: e.insertionPoint?.y ?? 0,
				sx: e.xScale ?? 1,
				sy: e.yScale ?? 1,
				rotation: e.rotation ?? 0,
				mirror: false,
			};
		case 'XLINE':
		case 'RAY': {
			/*
			 * 无限长构造线：数据里只有基点 + 单位方向（长度无限），
			 * 先按一个很大的假长度生成端点，展开后再统一裁到图纸实际范围
			 * （见 clipInfiniteEntities）——不裁的话导入后就是一条横贯画布、
			 * 把 zoomToAllPrimitives 视野彻底拉爆的直线。
			 *
			 * 用户反馈的「斜线有未导入的」即这两类（实测 case/example_2018.dwg
			 * 各 1 条，方向 (0.4475, -0.8943) / (0.8208, 0.5712)，确实是斜的）。
			 */
			const seg = infiniteLineEndpoints(toPoint2D(e.firstPoint), toPoint2D(e.unitDirection));
			if (!seg) {
				bumpSkipped(ctx, `${e.type}(方向无效)`);
				return null;
			}
			return { ...common, kind: 'LINE', start: seg.start, end: seg.end, infinite: true };
		}
		case 'WIPEOUT': {
			/*
			 * 遮罩（WIPEOUT）：EDA 没有「遮罩/蒙版」图元，导入为闭合轮廓，
			 * 至少把可见边界保留下来（此前整类被丢弃 → 用户反馈「AcDbWipeout(1) 没有导入」）。
			 */
			const pts = wipeoutBoundaryPoints(e);
			if (pts.length < 3) {
				bumpSkipped(ctx, 'WIPEOUT(无有效边界)');
				return null;
			}
			return { ...common, kind: 'LWPOLYLINE', points: pts, closed: true };
		}
		case 'ACAD_TABLE': {
			/*
			 * 表格：可见几何全在匿名块里——与 DIMENSION 同一套路（实测
			 * case/example_2018.dwg：ACAD_TABLE 落在 `*T13`，块内 32 条 LINE + 7 个 MTEXT，
			 * 且 startPoint=(0,0,0)，即块内几何已是表格局部坐标，用恒等 INSERT 即可）。
			 *
			 * 难点：解析库给出的 ACAD_TABLE **name 为空、blockRecordHandle 也是空串、
			 * rowCount=0 / cells 为空**，唯一线索是 AutoCAD 的 `*T<n>` 命名约定，
			 * 故按出现顺序从候选队列里认领（见 ToRawContext）。认不到就跳过并计入警告，
			 * 不再像以前那样静默消失。
			 */
			const blockName = resolveTableBlock(e, ctx);
			if (!blockName) {
				bumpSkipped(ctx, 'ACAD_TABLE(未找到匿名块)');
				return null;
			}
			return {
				...common,
				kind: 'INSERT',
				blockName,
				tx: e.startPoint?.x ?? 0,
				ty: e.startPoint?.y ?? 0,
				sx: 1,
				sy: 1,
				rotation: 0,
				mirror: false,
			};
		}
		default:
			/*
			 * 未支持的类型：**计数**而非静默丢弃。
			 * 面域（REGION）/三维实体（3DSOLID）在解析库里只有 ACIS 数据（satCache），
			 * 没有可用的二维几何，只能不导入——但必须让用户知道少了什么（汇总成解析警告）。
			 */
			bumpSkipped(ctx, e.type);
			return null;
	}
}

/**
 * LWPOLYLINE 的闭合标志位是 **512（0x200）**，不是 bit0。
 *
 * 实测依据（case/example_2000.dwg，用 libredwg 自身的 DXF 写出器取真值）：
 *   按 handle 逐条对照「解析库 flag」与「DXF group 70」——
 *     flag=0   → 70=0（开放）
 *     flag=512 → 70=1（闭合）
 *     flag=528 → 70=1（闭合，528 = 512 + 16）
 *   上游 libredwg-web 的渲染路径也是这么判的（`const closed = !!(lwpolyline.flag & 512)`）。
 *
 * 此前按 bit0 判定，导致上述 512/528 的多段线被当成开放导入：
 * 每个轮廓都少了最后一段闭合线，用户看到的就是「丢线段、不闭合」。
 */
function isLwPolylineClosed(flag: number | undefined): boolean {
	return typeof flag === 'number' && (flag & 512) !== 0;
}

/**
 * 旧式 POLYLINE2D/POLYLINE3D 的 flag 与 DXF group 70 同构，闭合位是 bit0。
 * 实测：handle 41A 的 POLYLINE3D 库 flag=1、DXF 70=9（1 闭合 + 8 三维多段线）。
 */
function isPolylineClosed(flag: number | undefined): boolean {
	return typeof flag === 'number' && (flag & 1) !== 0;
}

/**
 * ELLIPSE → 参数方程采样成折线（IR 中归入 SPLINE 曲线类）。
 * 几何：center + majorAxisEndPoint（圆心到长轴端点的向量，含方向与长半轴 a）
 * + axisRatio（短半轴 b = a × ratio）+ startAngle/endAngle（参数角，弧度）。
 * 全椭圆采 64 段；椭圆弧按扫掠角比例（至少 8 段）。
 */
function sampleEllipse(
	e: DwgEntityLike,
	common: { id?: string; layer: string; color?: number; lineWidth?: number },
): RawDwgEntity | null {
	const c = e.center;
	const major = e.majorAxisEndPoint;
	if (!c || !major)
		return null;
	const a = Math.hypot(major.x, major.y);
	if (!Number.isFinite(a) || a === 0)
		return null;
	const b = a * (e.axisRatio ?? 1);
	const rot = Math.atan2(major.y, major.x);
	const start = e.startAngle ?? 0;
	const end = e.endAngle ?? Math.PI * 2;
	const sweep = end - start;
	const isFull = Math.abs(Math.abs(sweep) - Math.PI * 2) < 1e-6;
	const segs = isFull
		? 64
		: Math.max(8, Math.ceil((Math.abs(sweep) / (Math.PI * 2)) * 64));
	const points: DwgPoint[] = [];
	for (let i = 0; i <= segs; i++) {
		const t = start + (sweep * i) / segs;
		const ex = a * Math.cos(t);
		const ey = b * Math.sin(t);
		points.push({
			x: c.x + ex * Math.cos(rot) - ey * Math.sin(rot),
			y: c.y + ex * Math.sin(rot) + ey * Math.cos(rot),
		});
	}
	// 全椭圆首尾重合：去掉重复末点，用 closed 表达闭合。
	if (isFull)
		points.pop();
	return { ...common, kind: 'SPLINE', points, closed: isFull };
}

function toPoint2D(p: Point3D | undefined): DwgPoint {
	return { x: p?.x ?? 0, y: p?.y ?? 0 };
}

/** 未导入类型计数 +1（key 可直接用实体类型名，或带一句原因）。 */
function bumpSkipped(ctx: ToRawContext, key: string): void {
	ctx.skipped.set(key, (ctx.skipped.get(key) ?? 0) + 1);
}

/**
 * 把「未导入类型」计数汇总成一条用户可见的解析警告。
 *
 * 为什么要有：以前 `default: return null` 是静默丢弃，用户导入后只看到
 * 「图元比 CAD 少」，既不知道少了什么、也不知道为什么（面域/三维实体就是
 * 「库里只有 ACIS 数据、拿不到二维几何」这一条硬限制）。
 */
function describeSkippedEntities(skipped: ReadonlyMap<string, number>): string | null {
	if (skipped.size === 0)
		return null;
	const parts = [...skipped.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([key, count]) => `${key} × ${count}`);
	return `以下 ${parts.length} 类实体未导入（解析库未提供可用的二维几何，或本扩展暂不支持）：${parts.join('、')}`;
}

/**
 * WIPEOUT 的边界点 → 世界坐标闭合轮廓。
 *
 * 数据形状（实测 case/example_2018.dwg，2 个 WIPEOUT）：
 *   `position` 左上角基点 + `uPixel`/`vPixel`（**整幅图**的两个方向向量）
 *   + `imageSize`（像素数，实测 (1,1)）+ `clippingBoundaryPath`（**归一化**坐标 0..1）。
 * 故世界坐标 = position + uPixel·(nx · imageSize.x) + vPixel·(ny · imageSize.y)。
 * imageSize 缺省按 1 处理（此时归一化坐标直接被 uPixel/vPixel 缩放）。
 */
function wipeoutBoundaryPoints(e: DwgEntityLike): DwgPoint[] {
	const path = e.clippingBoundaryPath ?? [];
	const pos = e.position;
	if (!pos || path.length < 3)
		return [];
	/*
	 * 图像坐标 → 世界坐标：世界 = position + uPixel·(nx·sx) + vPixel·(ny·sy)。
	 *
	 * 但边界点的 x 与 uPixel 方向**相反**——不处理整块遮罩会左右镜像（用户确认
	 * 「只有 AcDbWipeout 左右镜像」且已排除全局镜像）。注意**不能直接把 uPixel
	 * 取反**：那等于绕 position 做镜像，遮罩会整体跑到另一侧（用户反馈
	 * 「AcDbWipeout 的位置反了」）。正确做法是**原地镜像**——以边界点自身的 x
	 * 中点为中心翻转，遮罩所占范围不动、内部形状左右翻正（与用户 CAD/导入截图
	 * 逐格比对一致）。v 方向无需翻转。
	 */
	const u = e.uPixel ?? { x: 1, y: 0 };
	const v = e.vPixel ?? { x: 0, y: 1 };
	const sx = e.imageSize?.x ?? 1;
	const sy = e.imageSize?.y ?? 1;
	const xs = path.map(p => p.x).filter(v2 => Number.isFinite(v2));
	if (xs.length === 0)
		return [];
	const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
	const out: DwgPoint[] = [];
	for (const p of path) {
		if (!Number.isFinite(p.x) || !Number.isFinite(p.y))
			continue;
		const nx = 2 * midX - p.x;
		out.push({
			x: pos.x + u.x * nx * sx + v.x * p.y * sy,
			y: pos.y + u.y * nx * sx + v.y * p.y * sy,
		});
	}
	return out;
}

/**
 * 表格（ACAD_TABLE）→ 匿名块名。
 *
 * 优先用实体自带的 name / blockRecordHandle；两者都为空时（实测就是这种）
 * 从 `*T<n>` 候选队列里按出现顺序认领一个（AutoCAD 给每个表格建一个 `*T<n>` 块，
 * 顺序与表格出现顺序一致）。队列空则返回 null（调用方计入未导入警告）。
 */
function resolveTableBlock(e: DwgEntityLike, ctx: ToRawContext): string | null {
	if (typeof e.name === 'string' && e.name.length > 0)
		return e.name;
	if (typeof e.blockRecordHandle === 'string' && e.blockRecordHandle.length > 0) {
		// 句柄不是块名：仅在恰好存在同名候选时采用，否则退回命名约定
		const hit = ctx.tableBlocks.find(n => n === e.blockRecordHandle);
		if (hit)
			return hit;
	}
	return ctx.tableBlocks.shift() ?? null;
}

/**
 * 裁剪无限长构造线（XLINE / RAY）。
 *
 * 范围取**其他有限实体**的包围盒（不含构造线自身，否则假端点会把范围撑爆），
 * 四周留 2% 边距后按 Liang-Barsky 求交；完全落在范围外的直接丢弃并计数。
 * 裁剪后清掉 `infinite` 标记，IR 与后续写入流程看到的都是普通 LINE。
 */
function clipInfiniteEntities(entities: ReadonlyArray<DwgEntity>): { entities: DwgEntity[]; warnings: string[] } {
	const hasInfinite = entities.some(e => e.kind === 'LINE' && e.infinite);
	if (!hasInfinite)
		return { entities: [...entities], warnings: [] };

	const finite = entities.filter(e => !(e.kind === 'LINE' && e.infinite));
	const box = computeBoundingBox(finite);
	if (!box) {
		// 整张图只有构造线：没有可参照的范围，全部丢弃（否则必然横贯画布）
		const dropped = entities.length - finite.length;
		return {
			entities: finite,
			warnings: [`已跳过 ${dropped} 条无限长构造线（图中没有其他实体可确定图纸范围）`],
		};
	}

	const out: DwgEntity[] = [];
	let dropped = 0;
	for (const e of entities) {
		if (!(e.kind === 'LINE' && e.infinite)) {
			out.push(e);
			continue;
		}
		const seg = clipLineToBox(e.start, e.end, box);
		if (!seg) {
			dropped++;
			continue;
		}
		// 去掉 transient 标记，IR 里就是普通线段
		const { infinite: _drop, ...rest } = e;
		out.push({ ...rest, start: seg.start, end: seg.end });
	}
	const warnings: string[] = [];
	if (dropped > 0)
		warnings.push(`已跳过 ${dropped} 条完全落在图纸范围外的无限长构造线（XLINE/RAY）`);
	return { entities: out, warnings };
}

/**
 * MTEXT 展开成多行文本实体。
 *
 * EDA 的文本图元（`pcb_PrimitiveString`）一次只能画一行，故 MTEXT 必须拆开：
 *   1. 按 `\P`（硬换行）+ 参照矩形宽度折行拆成 N 行（见 dwg/mtext.ts）；
 *   2. 每行一个文本实体，从首行位置起按行距（5/3 × 字高）向下排；
 *   3. 首行位置按 attachmentPoint（上/中/下）从插入点反推。
 *
 * 拆行必须在 BLOCK 变换**之后**做——只有那时 position 才是最终坐标。
 * 只有一行（且不含格式码）的 MTEXT 原样保留，避免无谓地改变实体数量。
 */
function expandMultiLineText(entities: ReadonlyArray<DwgEntity>): DwgEntity[] {
	const out: DwgEntity[] = [];
	for (const e of entities) {
		if (e.kind !== 'MTEXT') {
			out.push(e);
			continue;
		}
		const lines = splitMTextLines(e.content, e.height, e.rectWidth);
		if (lines.length <= 1 && (lines[0] ?? '') === e.content) {
			out.push(e);
			continue;
		}
		if (lines.length === 0) {
			// 内容全是格式码（清理后为空）：不产出空文本图元
			continue;
		}
		const pitch = mtextLinePitch(e.height, e.lineSpacing);
		const offsetY = mtextFirstLineOffsetY(e.attachmentPoint ?? 1, lines.length, pitch);
		// 文本行沿 MTEXT 自身的旋转方向排列（旋转文本的行方向随之旋转）
		const cos = Math.cos(e.rotation);
		const sin = Math.sin(e.rotation);
		for (let i = 0; i < lines.length; i++) {
			const dy = offsetY - i * pitch;
			out.push({
				...e,
				content: lines[i]!,
				position: {
					x: e.position.x - dy * sin,
					y: e.position.y + dy * cos,
				},
				// 行已拆开：折行参数不再向下传递（IR 里不保留 transient 字段）
				rectWidth: undefined,
				attachmentPoint: undefined,
				lineSpacing: undefined,
			});
		}
	}
	return out;
}

/**
 * 判断样条是否真的闭合。
 *
 * `flag` 为 DWG/DXF 的样条标志位（bit0 闭合、bit1 周期、bit2 有理、bit3 平面）。
 * 实测有图纸把 bit0 置位但首末点相距数百单位——按标志闭合会补出一条横贯
 * 图纸的弦，与「原文件不相连」的预期相反。故要求几何自洽：
 * 周期样条天然闭合；其余必须首末点重合（容差取曲线自身尺度的 1e-6）。
 */
function isSplineClosed(flag: number, points?: Point3D[]): boolean {
	if ((flag & 2) !== 0)
		return true;
	if ((flag & 1) === 0 || !points || points.length < 2)
		return false;
	const first = points[0]!;
	const last = points[points.length - 1]!;
	const gap = Math.hypot(first.x - last.x, first.y - last.y);
	const xs = points.map(p => p.x);
	const ys = points.map(p => p.y);
	const diagonal = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
	return gap <= Math.max(1e-9, diagonal * 1e-6);
}

/**
 * DWG/DXF 圆弧恒为「自 startAngle 逆时针扫到 endAngle」（角度模 2π），
 * 但坐标里常见 end < start（实测该图纸 r=830.639、起 4.624、止 2.047）。
 * 直接相减得到负扫掠角，画出来就是互补的那段弧——用户反馈的「圆弧翻转了」。
 */
function arcSweepRad(start: number, end: number): number {
	const twoPi = Math.PI * 2;
	const raw = end - start;
	const sweep = ((raw % twoPi) + twoPi) % twoPi;
	return sweep === 0 && raw !== 0 ? twoPi : sweep;
}

/**
 * 把丢失的标注块名补回 DIMENSION（见 parseDwg 中的调用点说明）。
 *
 * 只接受「贴合到块几何上」的匹配（实测距离 0~2.7 单位，阈值 50），
 * 匹配不上的标注仍会走原来的「无匿名块」告警——宁可少画一条标注，
 * 也不要把别的标注几何搬过来。
 */
function assignDimensionBlocks(
	entities: unknown,
	ctx: ToRawContext,
): void {
	if (!Array.isArray(entities) || ctx.dimBlocks.length === 0)
		return;

	// 重名的匿名块改成唯一名，否则 buildBlockDefs 会互相覆盖
	const used = new Set<string>();
	for (const b of ctx.dimBlocks) {
		let name = b.name;
		let i = 2;
		while (used.has(name))
			name = `${b.name}#${i++}`;
		b.name = name;
		used.add(name);
	}

	const clouds = ctx.dimBlocks.map((b) => {
		const points: Array<{ x: number; y: number }> = [];
		for (const e of b.entities ?? []) {
			const anyE = e as {
				insertionPoint?: { x: number; y: number };
				center?: { x: number; y: number };
				start?: { x: number; y: number };
				end?: { x: number; y: number };
				vertices?: Array<{ x: number; y: number }>;
			};
			for (const q of [anyE.insertionPoint, anyE.center, anyE.start, anyE.end]) {
				if (q && Number.isFinite(q.x) && Number.isFinite(q.y))
					points.push(q);
			}
			for (const q of anyE.vertices ?? []) {
				if (Number.isFinite(q.x) && Number.isFinite(q.y))
					points.push(q);
			}
		}
		return { name: b.name, points, claimed: false };
	});

	for (const raw of entities as Array<{
		type?: string;
		name?: string;
		textPoint?: { x: number; y: number };
		definitionPoint?: { x: number; y: number };
	}>) {
		if (raw.type !== 'DIMENSION' || raw.name || clouds.length === 0)
			continue;
		const target = raw.textPoint ?? raw.definitionPoint;
		if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y))
			continue;
		let best: { cloud: (typeof clouds)[number]; dist: number } | null = null;
		for (const cloud of clouds) {
			if (cloud.claimed)
				continue;
			let min = Number.POSITIVE_INFINITY;
			for (const q of cloud.points)
				min = Math.min(min, Math.hypot(q.x - target.x, q.y - target.y));
			if (!best || min < best.dist)
				best = { cloud, dist: min };
		}
		if (best && best.dist <= 50) {
			best.cloud.claimed = true;
			raw.name = best.cloud.name;
		}
	}
}

/**
 * 收集「块名 → 块内 ATTDEF 标记」，供无名 INSERT 的可靠匹配使用。
 * 只收非布局、非外部参照且确有属性定义的块。
 */
function collectBlockAttrTags(
	blockEntries: BlockRecordLike[],
	ctx: ToRawContext,
): void {
	for (const b of blockEntries) {
		const isLayout = /^\*(?:Model|Paper)_Space/i.test(b.name);
		const isXref = typeof b.flags === 'number' && (b.flags & 4) !== 0;
		if (isLayout || isXref)
			continue;
		const tags: string[] = [];
		for (const e of b.entities ?? []) {
			const anyE = e as { type?: string; tag?: string };
			if (/^ATTDEF$/i.test(anyE.type ?? '') && typeof anyE.tag === 'string' && anyE.tag.length > 0)
				tags.push(anyE.tag);
		}
		ctx.blockAttrTags.push({ name: b.name, tags });
	}
}

/**
 * 给「块名为空」的 INSERT 补块名——**只做可靠匹配，不猜**。
 *
 * 判据：该 INSERT 带属性（attribs），且某个候选块的 ATTDEF 标记集合能覆盖
 * 全部属性标记，并且只有一个候选满足（唯一命中）时才认领。
 * 认领不到的按类型计入解析警告，让用户看到「有几个块引用没导入」。
 */
function assignInsertBlocks(
	entities: unknown,
	ctx: ToRawContext,
): void {
	if (!Array.isArray(entities) || ctx.blockAttrTags.length === 0)
		return;
	const claimed = new Set<string>();
	let unresolved = 0;
	for (const raw of entities as Array<{
		type?: string;
		name?: string;
		attribs?: Array<{ tag?: string }>;
	}>) {
		if (raw.type !== 'INSERT' || raw.name)
			continue;
		const tags = (raw.attribs ?? [])
			.map(a => a?.tag)
			.filter((t): t is string => typeof t === 'string' && t.length > 0);
		if (tags.length === 0) {
			unresolved++;
			continue;
		}
		const matches = ctx.blockAttrTags.filter(
			b => !claimed.has(b.name) && tags.every(t => b.tags.includes(t)),
		);
		if (matches.length !== 1) {
			unresolved++;
			continue;
		}
		claimed.add(matches[0]!.name);
		raw.name = matches[0]!.name;
	}
	if (unresolved > 0) {
		const key = 'INSERT(块名未读出，解析库限制)';
		ctx.skipped.set(key, (ctx.skipped.get(key) ?? 0) + unresolved);
	}
}

/**
 * 无名块引用的「唯一候选块」自动认领。
 *
 * 背景：重存过的图纸里 INSERT 的块名会被解析库读成空串，而库的底层取块名 API
 * （dwg_entity_get_block_name / dynapi）实测对任何指针都返回
 * Invalid object pointer passed!，自带 DXF 写出器也报 error code: 1——拿不到权威块名。
 *
 * 判定规则（确定性，不是猜）：先跑可靠匹配（属性标记命中 bloko、标注按位置邻近命中
 * 匿名标注块），此后若只剩唯一一个非匿名候选块（排除布局块、外部参照、* 开头匿名块
 * 与已被认领者），则把其余无名 INSERT 全部交给它；有多个候选时不认领，只计入警告。
 * 判定依据写进解析警告，用户可核对、可推翻。
 */
function autoAssignRemainingInserts(
	entities: unknown,
	ctx: ToRawContext,
): void {
	if (!Array.isArray(entities))
		return;
	const list = entities as Array<{ type?: string; name?: string }>;
	const named = new Set<string>();
	for (const e of list) {
		if (e.type === 'INSERT' && typeof e.name === 'string' && e.name.length > 0)
			named.add(e.name);
	}
	// 候选：非 * 开头（匿名块不会被普通 INSERT 引用）且尚未被任何 INSERT 认领
	const candidates = ctx.blockAttrTags.filter(b => !b.name.startsWith('*') && !named.has(b.name));
	const pending = list.filter(e => e.type === 'INSERT' && !e.name);
	const KEY = 'INSERT(块名未读出，解析库限制)';
	if (pending.length === 0) {
		ctx.skipped.delete(KEY);
		return;
	}
	if (candidates.length !== 1) {
		// 多个候选（或没有候选）时不做任何推断，只保留警告计数
		ctx.skipped.set(KEY, pending.length);
		return;
	}
	const target = candidates[0]!.name;
	for (const e of pending)
		e.name = target;
	ctx.skipped.delete(KEY);
	ctx.notes.push(
		`已自动把 ${pending.length} 个读不出块名的块引用按唯一候选图块「${target}」展开`
		+ '（解析库未提供块名；判定依据是可靠匹配后仅剩这一个非匿名候选块，如与预期不符请反馈）',
	);
}
