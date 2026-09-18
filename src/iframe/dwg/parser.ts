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

import type { DwgIR, DwgPoint } from '../../shared/types';
import type { RawDwgEntity } from './ir';
import { buildBlockDefs, expandInserts } from './block-expander';
import { buildIR, detectUnits } from './ir';
import { filterOutlierEntities } from './outlier';
import { vendorModuleUrl, vendorWasmUrl } from './resources';

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
	// LWPOLYLINE
	vertices?: Array<{ x: number; y: number }>;
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
	const blockDefsRaw: Array<{ name: string; entities: RawDwgEntity[] }> = [];
	for (const b of blockEntries) {
		const isLayout = /^\*(?:Model|Paper)_Space/i.test(b.name);
		const isXref = typeof b.flags === 'number' && (b.flags & 4) !== 0;
		const entityList = b.entities ?? [];
		if (isLayout || isXref || entityList.length === 0)
			continue;
		const converted: RawDwgEntity[] = [];
		for (const e of entityList) {
			const r = toRaw(e);
			if (r)
				converted.push(r);
		}
		blockDefsRaw.push({ name: b.name, entities: converted });
	}

	// 模型空间实体 → RawDwgEntity（含 INSERT）
	const rawEntities: RawDwgEntity[] = [];
	for (const e of modelEntities) {
		const r = toRaw(e);
		if (r)
			rawEntities.push(r);
	}

	const blockDefs = buildBlockDefs(blockDefsRaw);
	const expanded = expandInserts(rawEntities, blockDefs);
	options.onProgress?.(90);

	/*
	 * 离群过滤：极端缩放的辅助几何（如 xScale 数千倍的块引用）会把整体范围
	 * 拉到主体 hundreds 倍，导入后 zoomToAllPrimitives 的视野随之爆炸，
	 * 用户只看到「标尺巨大、什么都看不见」。默认剔除并写警告。
	 * IR.bbox / 图层计数 / 尺寸行都以过滤后的实体为准。
	 */
	const { kept, outliers, threshold } = options.filterOutliers === false
		? { kept: expanded.entities, outliers: [], threshold: null }
		: filterOutlierEntities(expanded.entities);
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
	const parseWarnings = [...expanded.warnings];
	if (outliers.length > 0 && threshold !== null) {
		parseWarnings.push(
			`已跳过 ${outliers.length} 个离群实体（距主体超过 ${Math.round(threshold)} 图纸单位，`
			+ '多为极端缩放的辅助/构造几何）——否则导入后画布视野会被拉到看不见图元',
		);
	}

	return buildIR({
		units: detectUnits(db.header?.INSUNITS, parseWarnings),
		layers,
		blocks,
		entities: finalEntities,
		parseWarnings,
	});
}

/** 把 libredwg-web 的实体对象转换成 RawDwgEntity；不支持的类型返回 null。 */
function toRaw(e: DwgEntityLike): RawDwgEntity | null {
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
				endAngle: e.endAngle ?? 0,
			};
		case 'LWPOLYLINE':
			return {
				...common,
				kind: 'LWPOLYLINE',
				points: (e.vertices ?? []).map(v => ({ x: v.x, y: v.y }) as DwgPoint),
				closed: isPolylineClosed(e.flag),
			};
		case 'POLYLINE2D':
		case 'POLYLINE3D':
			return {
				...common,
				kind: 'POLYLINE',
				points: (e.vertices ?? []).map(v => ({ x: v.x, y: v.y }) as DwgPoint),
				closed: isPolylineClosed(e.flag),
			};
		case 'SPLINE': {
			const pts = (e.fitPoints?.length ? e.fitPoints : e.controlPoints) ?? [];
			return {
				...common,
				kind: 'SPLINE',
				points: pts.map(p => toPoint2D(p)),
				closed: false,
			};
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
			};
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
			if (!e.name)
				return null;
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
		default:
			// ATTDEF / DIMENSION / HATCH / ELLIPSE / 3DFACE 等在 v1 中跳过。
			return null;
	}
}

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
