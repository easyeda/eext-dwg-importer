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

/** 常见 PCB 尺寸区间（mm）：比这更小不像板子，比这更大也基本不是 PCB。 */
const PCB_MIN_EXTENT_MM = 5;
const PCB_MAX_EXTENT_MM = 1000;

/** 各单位相对 mm 的换算系数。 */
const UNIT_TO_MM: Record<DwgUnit, number> = {
	mm: 1,
	cm: 10,
	m: 1000,
	inch: 25.4,
	mil: 0.0254,
	ft: 304.8,
	unknown: 1,
};

/** 「自动」档位的候选单位（按换算系数升序）。 */
const AUTO_UNIT_CANDIDATES: DwgUnit[] = ['mil', 'mm', 'cm', 'inch', 'm'];

/**
 * 按图纸**实际尺寸**修正单位（用户反馈：「导入单位需要自动根据 dwg 尺寸识别
 * 用什么单位最合适，PCB 尺寸不会非常大」）。
 *
 * 背景：机械图纸常声明 mm 但坐标上万（实测 case/example_2018.dwg 为
 * 14299×15600，INSUNITS=4mm）——照声明导入就是 14.3m×15.6m 的板子。
 * 规则：先信图纸声明；只有当换算后的最大边长落在常见 PCB 区间之外时，
 * 才在候选单位里挑一个（先满足尺寸区间，其次尽量少改单位），并写明确告警。
 * 用户手选单位时不走这里（手选即最终结果）。
 */
export function detectBestUnit(
	declared: DwgUnit,
	extent?: { width: number; height: number },
	warnings?: string[],
): DwgUnit {
	if (!extent)
		return declared;
	const span = Math.max(Math.abs(extent.width), Math.abs(extent.height));
	if (!(span > 0))
		return declared;
	const declaredFactor = UNIT_TO_MM[declared] ?? 1;
	const declaredMm = span * declaredFactor;
	if (declaredMm >= PCB_MIN_EXTENT_MM && declaredMm <= PCB_MAX_EXTENT_MM)
		return declared;

	let best: { unit: DwgUnit; score: number } | null = null;
	for (const unit of AUTO_UNIT_CANDIDATES) {
		const sizeMm = span * UNIT_TO_MM[unit]!;
		// 落在区间内记 0，否则按偏离倍数取对数（越离谱罚得越狠）。
		const penalty = sizeMm < PCB_MIN_EXTENT_MM
			? Math.log(PCB_MIN_EXTENT_MM / sizeMm)
			: sizeMm > PCB_MAX_EXTENT_MM
				? Math.log(sizeMm / PCB_MAX_EXTENT_MM)
				: 0;
		// 变更代价：与图纸声明单位的比例（同样合格时优先少改）。
		const change = Math.abs(Math.log(UNIT_TO_MM[unit]! / declaredFactor));
		const score = penalty * 100 + change;
		if (!best || score < best.score)
			best = { unit, score };
	}
	if (!best || best.unit === declared)
		return declared;

	const round = (v: number): number => Math.round(v * 10) / 10;
	warnings?.push(
		`图纸声明单位为 ${declared}，但按该单位解释后尺寸为 ${round(declaredMm)}mm`
		+ `（远超/远小于常见 PCB 尺寸 ${PCB_MIN_EXTENT_MM}~${PCB_MAX_EXTENT_MM}mm），`
		+ `已自动改用 ${best.unit}（约 ${round(span * UNIT_TO_MM[best.unit]!)}mm）。`
		+ `如与预期不符，请在「导入单位」里手动指定。`,
	);
	return best.unit;
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
