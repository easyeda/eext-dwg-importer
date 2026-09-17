/**
 * parser → block-expander 之间的临时 INSERT 类型；
 * 以及从 libredwg 输出构造 IR 的 helper。
 */

import type {
	DwgEntity,
	DwgInsertEntity,
	DwgIR,
	DwgPoint,
	DwgUnit,
} from '../../shared/types';

/** 规范化后的原始实体形状（由 parser.ts 从 @mlightcad/libredwg-web 的实体转换而来）。 */
export interface RawDwgEntity {
	id?: string;
	kind: string;
	layer: string;
	color?: number;
	lineWidth?: number;
	start?: DwgPoint;
	end?: DwgPoint;
	center?: DwgPoint;
	radius?: number;
	startAngle?: number;
	endAngle?: number;
	points?: DwgPoint[];
	closed?: boolean;
	position?: DwgPoint;
	content?: string;
	height?: number;
	rotation?: number;
	blockName?: string;
	tx?: number;
	ty?: number;
	sx?: number;
	sy?: number;
	mirror?: boolean;
}

let counter = 0;
function genId(): string {
	counter += 1;
	return `e_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/** 把 RawDwgEntity 转成 IR 中的 DwgEntity（不包含 INSERT）。 */
export function rawToEntity(raw: RawDwgEntity): DwgEntity {
	const base = {
		id: raw.id ?? genId(),
		layer: raw.layer,
		color: raw.color,
		lineWidth: raw.lineWidth,
	};
	switch (raw.kind) {
		case 'LINE':
			return { ...base, kind: 'LINE', start: raw.start ?? { x: 0, y: 0 }, end: raw.end ?? { x: 0, y: 0 } };
		case 'LWPOLYLINE':
		case 'POLYLINE':
		case 'SPLINE':
			return {
				...base,
				kind: raw.kind,
				points: raw.points ?? [],
				closed: raw.closed ?? false,
			};
		case 'CIRCLE':
			return { ...base, kind: 'CIRCLE', center: raw.center ?? { x: 0, y: 0 }, radius: raw.radius ?? 0 };
		case 'ARC':
			return {
				...base,
				kind: 'ARC',
				center: raw.center ?? { x: 0, y: 0 },
				radius: raw.radius ?? 0,
				startAngle: raw.startAngle ?? 0,
				endAngle: raw.endAngle ?? 0,
			};
		case 'TEXT':
		case 'MTEXT':
			return {
				...base,
				kind: raw.kind,
				position: raw.position ?? { x: 0, y: 0 },
				content: raw.content ?? '',
				height: raw.height ?? 1,
				rotation: raw.rotation ?? 0,
			};
		default:
			throw new Error(`Unsupported raw entity kind: ${raw.kind}`);
	}
}

/** 把 RawDwgEntity 转成 INSERT（仅在 block-expander 内部使用）。 */
export function rawToInsert(raw: RawDwgEntity): DwgInsertEntity {
	if (raw.kind !== 'INSERT') {
		throw new Error(`Expected INSERT, got ${raw.kind}`);
	}
	return {
		id: raw.id ?? genId(),
		kind: 'INSERT',
		layer: raw.layer,
		blockName: raw.blockName ?? '',
		tx: raw.tx ?? 0,
		ty: raw.ty ?? 0,
		sx: raw.sx ?? 1,
		sy: raw.sy ?? 1,
		rotation: raw.rotation ?? 0,
		mirror: raw.mirror ?? false,
	};
}

/** 计算包围盒（输入已展开的 DwgEntity[]）。 */
export function computeBoundingBox(entities: ReadonlyArray<DwgEntity>): { minX: number; minY: number; maxX: number; maxY: number } {
	if (entities.length === 0)
		return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	const consider = (x: number, y: number): void => {
		if (x < minX)
			minX = x;
		if (x > maxX)
			maxX = x;
		if (y < minY)
			minY = y;
		if (y > maxY)
			maxY = y;
	};
	for (const e of entities) {
		if (e.kind === 'LINE') {
			consider(e.start.x, e.start.y);
			consider(e.end.x, e.end.y);
		}
		else if (e.kind === 'CIRCLE') {
			consider(e.center.x - e.radius, e.center.y - e.radius);
			consider(e.center.x + e.radius, e.center.y + e.radius);
		}
		else if (e.kind === 'ARC') {
			consider(e.center.x - e.radius, e.center.y - e.radius);
			consider(e.center.x + e.radius, e.center.y + e.radius);
		}
		else if (e.kind === 'LWPOLYLINE' || e.kind === 'POLYLINE' || e.kind === 'SPLINE') {
			for (const p of e.points) consider(p.x, p.y);
		}
		else if (e.kind === 'TEXT' || e.kind === 'MTEXT') {
			consider(e.position.x, e.position.y);
		}
	}
	return { minX, minY, maxX, maxY };
}

/** 检测 DWG header 中的 INSUNITS，返回单位。 */
export function detectUnits(insunits: number | undefined): DwgUnit {
	if (insunits === 1 || insunits === 2 || insunits === 4 || insunits === 5 || insunits === 6)
		return 'inch';
	if (insunits === 0)
		return 'unknown';
	return 'mm';
}

/** 从 libredwg 输出组装 IR。 */
export function buildIR(opts: {
	units: DwgUnit;
	layers: Array<{ name: string; color: number; entityCount: number }>;
	blocks: Array<{ name: string; entityCount: number }>;
	entities: DwgEntity[];
	parseWarnings: string[];
}): DwgIR {
	return {
		source: 'DWG',
		units: opts.units,
		layers: opts.layers,
		blocks: opts.blocks,
		entities: opts.entities,
		bbox: computeBoundingBox(opts.entities),
		parseWarnings: opts.parseWarnings,
	};
}
