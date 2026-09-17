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
import { vendorModuleUrl, vendorWasmDir } from './resources';

export interface ParseOptions {
	onProgress?: (percent: number) => void;
	/** 最大实体数；超过则抛错。 */
	maxEntities?: number;
	/** 最大文件字节数。 */
	maxBytes?: number;
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
	dwg_read_data: (content: ArrayBuffer, fileType: number) => unknown;
	convert: (data: unknown) => DwgDatabaseLike;
	dwg_free?: (data: unknown) => void;
}

interface LibredwgModule {
	LibreDwg?: { create: (wasmDir?: string) => Promise<LibreDwgLike> };
	Dwg_File_Type?: { DWG: number; DXF: number };
}

const DWG_FILE_TYPE_DWG = 0;

async function loadModule(): Promise<{ libredwg: LibreDwgLike }> {
	// 1. 宿主预挂载（测试 / mock）。
	const fromGlobal = (globalThis as unknown as { __dwg_libredwg__?: LibreDwgLike }).__dwg_libredwg__;
	if (fromGlobal)
		return { libredwg: fromGlobal };

	/*
	 * 2. 从 HTML 登记的 blob URL 动态 import。
	 *
	 * 不能用 `new URL('../vendor/...', import.meta.url)`：
	 * 弹窗页面由 blob URL 承载，import.meta.url 形如 `blob:https://.../uuid`，
	 * 相对路径解析会抛 `Invalid URL`（已实测）。
	 * 故改由 index.html 的 <link rel="preload"> 登记、EDA 改写为 blob URL，
	 * 这里通过 resources.ts 取回。详见 resources.ts 顶部说明。
	 */
	let url: string;
	let wasmDir: string;
	try {
		url = vendorModuleUrl();
		wasmDir = vendorWasmDir();
	}
	catch (err) {
		throw new Error(`解析引擎资源缺失：${(err as Error).message}`);
	}

	let mod: LibredwgModule;
	try {
		mod = (await import(/* @vite-ignore */ url)) as unknown as LibredwgModule;
	}
	catch (err) {
		throw new Error(`加载解析引擎失败：${(err as Error).message}`);
	}

	const factory = mod.LibreDwg;
	if (!factory)
		throw new Error('解析引擎导出异常（缺少 LibreDwg）');

	// create(filepath) 内部会拼成 `${filepath}/${filename}`，故传目录。
	return { libredwg: await factory.create(wasmDir) };
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
	try {
		const ptr = libredwg.dwg_read_data(buffer, DWG_FILE_TYPE_DWG);
		if (ptr === undefined || ptr === null) {
			throw new Error('dwg_read_data returned no data');
		}
		db = libredwg.convert(ptr);
	}
	catch (err) {
		throw new Error(`Parse error: ${(err as Error).message}`);
	}
	options.onProgress?.(70);

	const modelEntities = db.entities ?? [];
	if (options.maxEntities && modelEntities.length > options.maxEntities) {
		throw new Error(`Too many entities (>${options.maxEntities})`);
	}

	// BLOCK 定义：BLOCK_RECORD 表每一项带 entities；flags bit4/bit8 表示 XREF。
	const blockEntries = db.tables?.BLOCK_RECORD?.entries ?? [];
	const blockDefsRaw: Array<{ name: string; entities: RawDwgEntity[] }> = [];
	for (const b of blockEntries) {
		const isXref = typeof b.flags === 'number' && (b.flags & 4) !== 0;
		const entityList = b.entities ?? [];
		if (isXref || entityList.length === 0)
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

	// 图层统计
	const layerEntries = db.tables?.LAYER?.entries ?? [];
	const counts = new Map<string, number>();
	for (const e of expanded.entities) {
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

	return buildIR({
		units: detectUnits(db.header?.INSUNITS),
		layers,
		blocks,
		entities: expanded.entities,
		parseWarnings: expanded.warnings,
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

function toPoint2D(p: Point3D | undefined): DwgPoint {
	return { x: p?.x ?? 0, y: p?.y ?? 0 };
}
