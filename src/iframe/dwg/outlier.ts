/**
 * 离群实体过滤：DWG 里常有被极端缩放的辅助几何（构造线、按图放大数倍引用的
 * 块等），单个实体就能把整体范围拉到主体尺寸的成百上千倍。
 *
 * 实测案例（case/example_2000.dwg）：块 bloko 的一个 INSERT 带
 * xScale=3256.5 / yScale=-1843.5，块内 3 条线（局部坐标 ±800）展开后横跨
 * ±270 万 mm，而主体只有 ±1.4 万 mm。若照单全收，导入后 EDA 的
 * zoomToAllPrimitives 会把视野拉到 3.5 km 宽——正常图形缩成不可见的点
 * （用户表现为「标尺极大、看不到图元」，极易误判成「单位选错了」）。
 *
 * 算法 = 真实距离 + 自然断点（跳变检测）：
 *   1. 求中位数中心点（对离群鲁棒）；
 *   2. 每个实体取几何到该点的**真实距离**（点到线段 / |d-r| / 点距），
 *      不用点到 bbox 的距离——斜穿全图的跑飞线，其 bbox 必然覆盖中心点，
 *      但线段本身离中心很远（本案例 36 万 mm），bbox 口径会漏判；
 *      真实距离对图框/边框也是安全的（到中心 ≈ 半幅宽，远小于断点）；
 *   3. 距离升序排列后找**相邻跳变 ≥ GAP_FACTOR 且上方实体 ≤ 20%** 的最小
 *      断点，其上方全部判为离群。用跳变而不是固定分位数阈值的原因：
 *      - 密集核心 + 渐变外围的图纸（如 case/example_r13.dwg，p90 附近距离
 *        平滑连续到 4500），固定阈值会把外围正常实体误杀；
 *      - 跳变检测只在存在真正断档时切分（本案例断档 75~165 倍），
 *        渐变分布不存在 qualifying 跳变 → 自然退化为不过滤（fail-open）。
 *   4. 断档比例 20 倍、占比上限 20% 的依据：实测断档 75~165 倍、离群占比
 *      0.2%~4%；正常图纸的距离分布尾部的相邻跳变一般在 2 倍以内，余量充足。
 */

import type { DwgEntity } from '../../shared/types';

/** 相邻距离跳变达到该倍数视为「断档」。 */
const GAP_FACTOR = 20;
/** 断档上方实体占比超过该值说明是两个正常簇而非离群，不切分。 */
const MAX_OUTLIER_RATIO = 0.2;
/** 实体太少时统计不稳定，直接不过滤。 */
const MIN_ENTITIES = 8;

/** 点到线段的最短距离。 */
function pointSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	const len2 = dx * dx + dy * dy;
	if (len2 === 0)
		return Math.hypot(px - ax, py - ay);
	// t = 投影参数，截断到 [0,1]
	const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
	return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** 实体几何到点 (cx, cy) 的最短距离。取的是下界（宁保留勿误杀）。 */
export function distanceToEntity(e: DwgEntity, cx: number, cy: number): number {
	switch (e.kind) {
		case 'LINE':
			return pointSegDist(cx, cy, e.start.x, e.start.y, e.end.x, e.end.y);
		case 'CIRCLE':
			return Math.max(0, Math.hypot(cx - e.center.x, cy - e.center.y) - e.radius);
		case 'ARC': {
			// 下界 = min(到圆弧两端点的距离, 到整圆的距离)。
			const d1 = Math.hypot(cx - (e.center.x + Math.cos(e.startAngle) * e.radius), cy - (e.center.y + Math.sin(e.startAngle) * e.radius));
			const d2 = Math.hypot(cx - (e.center.x + Math.cos(e.endAngle) * e.radius), cy - (e.center.y + Math.sin(e.endAngle) * e.radius));
			return Math.min(d1, d2, Math.max(0, Math.hypot(cx - e.center.x, cy - e.center.y) - e.radius));
		}
		case 'TEXT':
		case 'MTEXT':
			return Math.hypot(cx - e.position.x, cy - e.position.y);
		default: {
			// 折线/样条：逐段取最小。单点退化为点距；无点返回 0（保留，宁勿误杀）。
			const pts = e.points ?? [];
			if (pts.length === 0)
				return 0;
			if (pts.length === 1)
				return Math.hypot(cx - pts[0]!.x, cy - pts[0]!.y);
			let best = Number.POSITIVE_INFINITY;
			for (let i = 1; i < pts.length; i++)
				best = Math.min(best, pointSegDist(cx, cy, pts[i - 1]!.x, pts[i - 1]!.y, pts[i]!.x, pts[i]!.y));
			return best;
		}
	}
}

export interface OutlierFilterResult {
	kept: DwgEntity[];
	outliers: DwgEntity[];
	/** 断点距离（保留实体中的最大距离，诊断/警告文案用）；未切分时为 null。 */
	threshold: number | null;
}

export function filterOutlierEntities(entities: ReadonlyArray<DwgEntity>): OutlierFilterResult {
	if (entities.length < MIN_ENTITIES)
		return { kept: [...entities], outliers: [], threshold: null };

	const centerX = medianOf(entities.map(e => geoCenter(e).x));
	const centerY = medianOf(entities.map(e => geoCenter(e).y));

	const sorted = entities
		.map(e => ({ e, d: distanceToEntity(e, centerX, centerY) }))
		.sort((a, b) => a.d - b.d);

	// 找最小 qualifying 断点：跳变 ≥ GAP_FACTOR 且上方实体 ≤ 20%。
	let cutIndex = -1; // sorted[cutIndex] 为保留侧最大距离
	for (let i = Math.floor(sorted.length / 2); i < sorted.length - 1; i++) {
		const lower = sorted[i]!.d;
		const upper = sorted[i + 1]!.d;
		if (lower <= 0)
			continue;
		if (upper / lower < GAP_FACTOR)
			continue;
		if (sorted.length - 1 - i > sorted.length * MAX_OUTLIER_RATIO)
			continue;
		cutIndex = i;
		break;
	}

	if (cutIndex < 0)
		return { kept: [...entities], outliers: [], threshold: null };

	const kept = sorted.slice(0, cutIndex + 1).map(x => x.e);
	const outliers = sorted.slice(cutIndex + 1).map(x => x.e);
	return { kept, outliers, threshold: sorted[cutIndex]!.d };
}

/** 实体的几何中心（bbox 中心），仅用于求中位数中心点。 */
function geoCenter(e: DwgEntity): { x: number; y: number } {
	switch (e.kind) {
		case 'LINE':
			return { x: (e.start.x + e.end.x) / 2, y: (e.start.y + e.end.y) / 2 };
		case 'CIRCLE':
		case 'ARC':
			return e.center;
		case 'TEXT':
		case 'MTEXT':
			return e.position;
		default: {
			const pts = e.points ?? [];
			if (pts.length === 0)
				return { x: 0, y: 0 };
			const xs = pts.map(p => p.x);
			const ys = pts.map(p => p.y);
			return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
		}
	}
}

function medianOf(values: number[]): number {
	if (values.length === 0)
		return 0;
	const s = [...values].sort((a, b) => a - b);
	const mid = Math.floor(s.length / 2);
	return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}
