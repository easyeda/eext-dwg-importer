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
	/** XLINE / RAY：已生成假端点，标记为「待按图纸范围裁剪的无限长线」。 */
	infinite?: boolean;
	/** MTEXT 折行参数（见 shared/types.ts 的同名字段说明）。 */
	rectWidth?: number;
	attachmentPoint?: number;
	lineSpacing?: number;
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
			return {
				...base,
				kind: 'LINE',
				start: raw.start ?? { x: 0, y: 0 },
				end: raw.end ?? { x: 0, y: 0 },
				// 仅 XLINE/RAY 会带此标记；普通线为 undefined（不写入对象）。
				...(raw.infinite ? { infinite: true } : {}),
			};
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
				...(raw.kind === 'MTEXT'
					? {
							rectWidth: raw.rectWidth,
							attachmentPoint: raw.attachmentPoint,
							lineSpacing: raw.lineSpacing,
						}
					: {}),
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

/**
 * 检测 DWG header 中的 INSUNITS，返回单位；无法判定时写入解析警告。
 *
 * 枚举对照 libredwg-web `DwgHeader.INSUNITS` 的文档（AutoCAD 标准）：
 * 0 无单位 / 1 英寸 / 2 英尺 / 3 英里 / 4 毫米 / 5 厘米 / 6 米 / 9 mil / 10 码…
 *
 * v1.2.0 修复：此前 4/5/6（mm/cm/m）被误判为 inch，mm 图纸按 ×1000
 * 而非 ×39.37 换算，导入图元放大 25.4 倍。
 */
export function detectUnits(insunits: number | undefined, warnings?: string[]): DwgUnit {
	switch (insunits) {
		case 1:
			return 'inch';
		case 2:
			return 'ft';
		case 4:
			return 'mm';
		case 5:
			return 'cm';
		case 6:
			return 'm';
		case 9:
			return 'mil';
		case 0:
			// 明确声明「无单位」：按 mm 解释，但必须让用户知道这是假设。
			warnings?.push('图纸未声明单位（INSUNITS=0），将按 mm 解释');
			return 'unknown';
		default:
			warnings?.push(typeof insunits === 'number'
				? `无法识别的图纸单位代码（INSUNITS=${insunits}），将按 mm 解释`
				: 'DWG 头部未声明单位（缺少 INSUNITS），将按 mm 解释');
			return 'unknown';
	}
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
