/**
 * 多段线凸度（bulge）展开：把带圆弧的多段线展开成纯点列。
 *
 * 背景（实测，case/example_2000.dwg）：
 *   - 该图纸模型空间有 2 条多段线的**每个顶点都带 bulge**（25 顶点与 3635 顶点），
 *     DXF 真值（libredwg `dwg_write_dxf` 的 group 42）与解析库字段完全一致，
 *     均为 ±0.52056705 → 每段是 110° 的圆弧；
 *   - 此前解析只取顶点坐标、丢弃 bulge，圆角/齿形全部退化成直弦，
 *     表现为「线条不对、轮廓不闭合」。
 *
 * 凸度语义（DXF 标准，已由 group 42 真值确认）：
 *   bulge = tan(θ/4)，θ 为该段圆弧的扫掠角；正值逆时针（左凸），负值顺时针。
 *
 * 采样策略：
 *   1. 每段按「矢高 / 弦长」相对容差（scale 无关）求期望内插点数（见 shared/curve.ts）；
 *   2. 每段至少保底 1 个内插点，保证弧的走向不丢；
 *   3. 整个实体有 4096 点预算，余量按各段扫掠角占比分配（上限 8 点/段）。
 *      超预算时只有保底点，总量不超过 max(4096, 2×顶点数)——顶点数是图纸自身的数据量，
 *      实测 3635 顶点那条齿形的半径只有 0.305、弦长 0.5，两段弦近似的矢高误差
 *      0.13 单位，而整图宽 14300 单位（误差占比 0.001%，肉眼不可见）。
 */

import type { DwgPoint } from '../../shared/types';
import { arcSegmentsForSweep } from '../../shared/curve';

/** 单个实体的点数上限（含原始顶点）；超出部分只保留每段 1 点的保底内插。 */
const MAX_POINTS_PER_ENTITY = 4096;
/** 顶点数超过该值就完全不展开（机器生成的超密多段线，弧段细节已远小于图纸尺度）。 */
const MAX_VERTICES_TO_EXPAND = 32768;
/** 单段圆弧的内插点数上限。 */
const MAX_SEGMENTS_PER_ARC = 8;
/** 矢高 / 弦长 的相对误差上限。 */
const TOL_RATIO = 0.02;
/** |bulge| 小于该值视为直线（避免 tan 趋零导致圆心算到无穷远）。 */
const MIN_BULGE = 1e-6;
/** |bulge| 大于该值说明扫掠角逼近 360°，两端点几乎重合，数值上不可靠，按直线处理。 */
const MAX_BULGE = 1e4;

export interface BulgeVertex {
	x: number;
	y: number;
	bulge?: number;
}

/**
 * 展开多段线顶点上的凸度（圆弧段）为纯点列。
 *
 * @param vertices 原始顶点（可带 bulge）
 * @param closed 是否闭合；闭合时会额外展开「末点→首点」那一弧段
 * @returns 展开后的点列。**闭合时不补首点**——补点由 writer 的 mkPolygon 统一处理。
 */
export function expandBulgeVertices(vertices: ReadonlyArray<BulgeVertex>, closed: boolean): DwgPoint[] {
	const n = vertices.length;
	if (n === 0)
		return [];
	if (n < 2 || !vertices.some(v => typeof v.bulge === 'number' && v.bulge !== 0))
		return vertices.map(v => ({ x: v.x, y: v.y }));
	/*
	 * 顶点数本身已经极端的多段线（机器生成的填充/扫描线）整体不展开：
	 * 它的弧段细节必然远小于图纸尺度，展开只会把点数翻倍放大到几十万。
	 */
	if (n > MAX_VERTICES_TO_EXPAND)
		return vertices.map(v => ({ x: v.x, y: v.y }));

	// 弧段列表：闭合时补「末点 → 首点」一段（其凸度记在末顶点上）
	const segs: Array<{ from: BulgeVertex; to: BulgeVertex; bulge: number }> = [];
	for (let i = 0; i < n - 1; i++)
		segs.push({ from: vertices[i]!, to: vertices[i + 1]!, bulge: vertices[i]!.bulge ?? 0 });
	if (closed && n > 2)
		segs.push({ from: vertices[n - 1]!, to: vertices[0]!, bulge: vertices[n - 1]!.bulge ?? 0 });

	const angles = segs.map(s => arcAngle(s.bulge));
	// 注意取绝对值：负凸度（顺时针弧）的扫掠角是负的，按符号判 0 会让顺时针弧全部丢失内插点
	const absAngles = angles.map(a => Math.abs(a));
	const want = absAngles.map(a => (a > 0 ? arcSegmentsForSweep(a, TOL_RATIO, MAX_SEGMENTS_PER_ARC, 1) : 0));
	/*
	 * 点数分配分两层，保证「均匀」优先于「精细」：
	 *   1. 每段弧先保底 1 个内插点——该段被折成两段弦，弧的走向不会丢，
	 *      总量最多 2×顶点数（即图纸自身的密度级别，可接受）；
	 *   2. 总量仍在 MAX_POINTS_PER_ENTITY 预算内时，再按扫掠角占比把余量加到各段（上限 8 点/段）。
	 * 只按比例分配的话，超密多段线会出现「少数弧有中点、多数弧没有」的不均匀外观。
	 */
	const base = want.map(w => (w > 0 ? 1 : 0));
	const baseTotal = n + base.reduce((a: number, b) => a + b, 0);
	const extraBudget = MAX_POINTS_PER_ENTITY - baseTotal;
	const extra = extraBudget > 0
		? allocatePoints(absAngles, want.map((w, i) => w - base[i]!), extraBudget)
		: undefined;
	const alloc = base.map((b, i) => b + (extra?.[i] ?? 0));

	const out: DwgPoint[] = [];
	const lastSegIndex = segs.length - 1;
	for (let k = 0; k < segs.length; k++) {
		const seg = segs[k]!;
		if (k === 0)
			out.push({ x: seg.from.x, y: seg.from.y });
		for (const p of arcInteriorPoints(seg.from, seg.to, seg.bulge, alloc[k]!))
			out.push(p);
		// 闭合时最后一段的终点就是首点，交由 mkPolygon 补，避免重复点
		if (!(closed && k === lastSegIndex))
			out.push({ x: seg.to.x, y: seg.to.y });
	}
	return out;
}

/** 圆弧扫掠角（弧度，带符号）。 */
function arcAngle(bulge: number): number {
	if (!Number.isFinite(bulge) || Math.abs(bulge) < MIN_BULGE || Math.abs(bulge) > MAX_BULGE)
		return 0;
	return 4 * Math.atan(bulge);
}

/** 按各段扫掠角占比分配内插点数（向下取整后按小数部分补余数），不超过各段期望值。 */
function allocatePoints(angles: ReadonlyArray<number>, caps: ReadonlyArray<number>, budget: number): number[] {
	const total = angles.reduce((a, b) => a + b, 0);
	if (!(total > 0) || budget <= 0)
		return angles.map(() => 0);
	const exact = angles.map(a => (budget * a) / total);
	const out = exact.map((e, i) => Math.min(caps[i]!, Math.floor(e)));
	let used = out.reduce((a, b) => a + b, 0);
	// Σexact = budget，故小数部分之和 < 段数，一趟即可补完
	const order = exact
		.map((e, i) => ({ i, frac: e - Math.floor(e) }))
		.sort((a, b) => b.frac - a.frac);
	for (const { i } of order) {
		if (used >= budget)
			break;
		if (out[i]! < caps[i]!) {
			out[i]!++;
			used++;
		}
	}
	return out;
}

/**
 * 求一段圆弧的内插点（不含两端点）。
 *
 * 标准公式（已与解析库上游 createPolylineArcPoints 的行为一致性核对，并做了
 * 解析验证：b=0.4142/θ=90° 时圆心=(0.5,0.5)、矢高=b·弦长/2）：
 *   θ = 4·atan(bulge)，弦长 c，半径 r = c / (2·sin(θ/2))，
 *   圆心在弦中点沿**左法线**偏移 h = r·cos(θ/2)（|θ|>180° 时 cos 为负，圆心自动落到另一侧）。
 */
function arcInteriorPoints(from: BulgeVertex, to: BulgeVertex, bulge: number, count: number): DwgPoint[] {
	if (count <= 0)
		return [];
	const theta = arcAngle(bulge);
	if (theta === 0)
		return [];
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const chord = Math.hypot(dx, dy);
	if (!(chord > 0))
		return [];

	const half = theta / 2;
	const sinHalf = Math.sin(half);
	if (Math.abs(sinHalf) < 1e-12)
		return [];
	// 半径带符号（负凸度时为负），仅用于求圆心偏移；取点必须用**绝对值**，
	// 否则负凸度的弧会被镜像到圆心另一侧（同圆上，只查「到圆心等距」发现不了）。
	const signedRadius = chord / (2 * sinHalf);
	const offset = signedRadius * Math.cos(half);
	const radius = Math.abs(signedRadius);
	// 左法线 = 弦方向逆时针旋转 90°
	const nx = -dy / chord;
	const ny = dx / chord;
	const cx = (from.x + to.x) / 2 + nx * offset;
	const cy = (from.y + to.y) / 2 + ny * offset;
	const startAngle = Math.atan2(from.y - cy, from.x - cx);

	const pts: DwgPoint[] = [];
	for (let i = 1; i <= count; i++) {
		const ang = startAngle + (theta * i) / (count + 1);
		pts.push({ x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius });
	}
	return pts;
}
