/**
 * SPLINE（B 样条 / 拟合点型样条）→ 折线采样。
 *
 * 为什么必须真求值：
 *   DWG 的 SPLINE 是**曲线**，控制点（或拟合点）只是它的定义数据。
 *   早期实现把控制点直接当折线顶点连起来（等于画控制多边形），
 *   导入后贝塞尔/样条全变成折线段——用户反馈「贝塞尔曲线需要转多段线拟合」。
 *
 * 实测数据形状（case/example_2018.dwg，libredwg-web 输出）：
 *   - 拟合点型：`{ flag: 9, degree: 3, knots: [], controlPoints: [], fitPoints: [6 点],
 *     startTangent, endTangent }` —— 没有节点向量，必须自己做**插值拟合**；
 *   - 控制点型：同时给出 `knots` 与 `controlPoints`（可能带 `weights`）—— 用 de Boor 求值。
 *
 * 采样判据与圆弧采样同口径：**矢高 / 弦长 ≤ tolRatio**（与图纸尺度无关），
 * 递归二分，受 minSegments / maxPoints 约束。
 */

import type { DwgPoint } from '../../shared/types';

export interface SplineCurveInput {
	/** B 样条阶数（DWG degree，通常 3）。 */
	degree?: number;
	/** 节点向量；长度应为 controlPoints.length + degree + 1。 */
	knots?: ReadonlyArray<number>;
	controlPoints?: ReadonlyArray<DwgPoint>;
	/** 有理样条权重（与 controlPoints 等长）。 */
	weights?: ReadonlyArray<number>;
	fitPoints?: ReadonlyArray<DwgPoint>;
	/** 端点切向（拟合点型样条的端导数）；单位向量。 */
	startTangent?: DwgPoint;
	endTangent?: DwgPoint;
	closed?: boolean;
}

export interface SampleSplineOptions {
	/** 相对容差：矢高 / 弦长 上限（默认 0.002 = 0.2%）。 */
	tolRatio?: number;
	/**
	 * 单条曲线点数上限（默认 512）。
	 *
	 * 为什么不取更大：容差是**相对**判据，大曲线会解出上千个点（实测
	 * case/example_2018.dwg 有一条样条按 0.2% 容差要求 989 点，段长不到 1 图纸单位，
	 * 已远超显示所需）。一张图里样条一多，顶点数会成倍放大 EDA 画布负担。
	 * 超预算时由 sampleWithBudget **放松容差重采**（而不是截断），
	 * 于是每条曲线的实际精度自动调到预算允许的最好水平。
	 */
	maxPoints?: number;
	/** 最少段数（默认 8）。 */
	minSegments?: number;
}

/** 二分细化的最大递归深度：防止退化曲线（弦长趋零）无限细分。 */
const MAX_DEPTH = 16;
/** 判定两点重合的距离（图纸单位）。 */
const EPS_DIST = 1e-9;

type CurveFn = (t: number) => DwgPoint;
interface Evaluator { fn: CurveFn; t0: number; t1: number }

/**
 * 采样为折线点列。
 *
 * 无法求值时返回 `[]`（调用方据此退回原始点串）；
 * **不抛异常**——解析一张图纸不应因单条曲线数据异常而整体失败。
 */
export function sampleSplineCurve(input: SplineCurveInput, options: SampleSplineOptions = {}): DwgPoint[] {
	const tolRatio = options.tolRatio ?? 0.002;
	const maxPoints = Math.max(16, options.maxPoints ?? 512);
	const minSegments = Math.max(1, options.minSegments ?? 8);

	const ev = buildEvaluator(input);
	if (!ev)
		return [];

	const points = sampleWithBudget(ev, tolRatio, minSegments, maxPoints);
	return dedupe(points);
}

/**
 * 在点数预算内自适应采样。
 *
 * 关键点：**点数超预算时要放松容差重采，不能把结果截断**——
 * 直接截断会丢掉曲线尾段（连端点都没了），折线末端凭空断掉，
 * 而且越密的容差丢得越多（实测 tolRatio=1e-4 的三次贝塞尔正好被截在 2048 点）。
 * 放松容差重采则始终保留完整曲线 + 两个端点，只是曲率大的地方点变稀。
 */
function sampleWithBudget(ev: Evaluator, tolRatio: number, minSegments: number, maxPoints: number): DwgPoint[] {
	// 每次递归细分的硬上限：仅用于尽早发现「超预算」，不参与最终输出
	const hardLimit = Math.max(maxPoints * 4, maxPoints + 16);
	let tol = tolRatio;
	for (let attempt = 0; attempt < 24; attempt++) {
		const pts = adaptiveSample(ev, tol, minSegments, hardLimit);
		if (pts.length <= maxPoints)
			return pts;
		// 点数大致与 sqrt(1/tol) 成正比，翻倍容差通常两三次就收敛
		tol *= 2;
	}
	// 极端情形（容差放大到极限仍超预算）：均匀采样，保证端点与点数可控
	const count = Math.max(2, maxPoints);
	return Array.from({ length: count }, (_, i) => ev.fn(ev.t0 + ((ev.t1 - ev.t0) * i) / (count - 1)));
}

/** 按输入形态选择求值器：控制点型 → de Boor；拟合点型 → 三次样条插值。 */
function buildEvaluator(input: SplineCurveInput): Evaluator | null {
	const cps = sanitize(input.controlPoints);
	const degree = typeof input.degree === 'number' && Number.isFinite(input.degree) ? Math.floor(input.degree) : 0;
	const knots = input.knots;
	if (cps.length >= degree + 1 && degree >= 1 && knots && knots.length >= cps.length + degree + 1) {
		const bs = buildBSpline(cps, knots, degree, input.weights);
		if (bs)
			return bs;
	}
	const fits = sanitize(input.fitPoints);
	if (fits.length >= 2)
		return buildFitSpline(fits, input.startTangent, input.endTangent);
	return null;
}

/** 过滤非有限点；少于 2 个点时返回空。 */
function sanitize(pts: ReadonlyArray<DwgPoint> | undefined): DwgPoint[] {
	if (!pts)
		return [];
	return pts.filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)).map(p => ({ x: p.x, y: p.y }));
}

/** 控制点型：齐次坐标下的 de Boor 求值（有理时按权重做齐次除法）。 */
function buildBSpline(
	cps: ReadonlyArray<DwgPoint>,
	knots: ReadonlyArray<number>,
	degree: number,
	weights: ReadonlyArray<number> | undefined,
): Evaluator | null {
	const n = cps.length - 1;
	const t0 = knots[degree]!;
	const t1 = knots[n + 1]!;
	if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0)
		return null;

	// 齐次控制点 [x·w, y·w, w]；权重非法时退化为 w = 1（非有理）。
	const rational = Array.isArray(weights)
		&& weights.length === cps.length
		&& weights.every(w => Number.isFinite(w) && w > 0);
	const d: Array<[number, number, number]> = cps.map((p, i) => {
		const w = rational ? weights![i]! : 1;
		return [p.x * w, p.y * w, w];
	});

	const findSpan = (u: number): number => {
		// 线性扫描并夹紧：控制点规模不大，但对重节点（分段连续）天然鲁棒。
		let span = degree;
		for (let i = degree; i <= n; i++) {
			const lo = knots[i]!;
			const hi = knots[i + 1]!;
			if (u >= lo && u < hi) {
				span = i;
				break;
			}
			if (u >= hi)
				span = Math.min(i + 1, n);
		}
		if (u <= knots[degree]!)
			span = degree;
		if (u >= knots[n + 1]!)
			span = n;
		return span;
	};

	const fn: CurveFn = (t) => {
		const u = Math.min(Math.max(t, t0), t1);
		const span = findSpan(u);
		const dd: Array<[number, number, number]> = [];
		for (let j = 0; j <= degree; j++)
			dd[j] = [...d[span - degree + j]!];
		for (let r = 1; r <= degree; r++) {
			for (let j = degree; j >= r; j--) {
				const denom = knots[span + 1 + j - r]! - knots[span - degree + j]!;
				const alpha = Math.abs(denom) < 1e-12 ? 0 : (u - knots[span - degree + j]!) / denom;
				const prev = dd[j - 1]!;
				const cur = dd[j]!;
				dd[j] = [
					(1 - alpha) * prev[0] + alpha * cur[0],
					(1 - alpha) * prev[1] + alpha * cur[1],
					(1 - alpha) * prev[2] + alpha * cur[2],
				];
			}
		}
		const last = dd[degree]!;
		const w = Math.abs(last[2]) < 1e-12 ? 1 : last[2];
		return { x: last[0] / w, y: last[1] / w };
	};

	return { fn, t0, t1 };
}

/**
 * 拟合点型：以弦长为参数的三次样条插值（曲线**精确通过**每个拟合点）。
 *
 * 用二阶导（moment）形式 + 三对角方程（Thomas 求解）：
 *   内部节点：(h_{i-1}/6)M_{i-1} + ((h_{i-1}+h_i)/3)M_i + (h_i/6)M_{i+1} = δ_i - δ_{i-1}
 *   端条件：给了切向用 clamped（S'(u) = 切向），否则自然边界（M = 0）。
 * 选它而不是 Catmull-Rom：后者不保证通过给定端点切向，而 DWG 把 startTangent /
 * endTangent 明确写出来了，用不上会白白丢掉端点方向。
 */
function buildFitSpline(
	pts: ReadonlyArray<DwgPoint>,
	startTangent: DwgPoint | undefined,
	endTangent: DwgPoint | undefined,
): Evaluator | null {
	const P = dedupe(pts);
	if (P.length < 2)
		return null;

	const segs = P.length - 1;
	// 参数：弦长累积
	const U: number[] = [0];
	const H: number[] = [];
	for (let i = 0; i < segs; i++) {
		const a = P[i]!;
		const b = P[i + 1]!;
		const h = Math.hypot(b.x - a.x, b.y - a.y);
		if (h < EPS_DIST)
			return null;
		H.push(h);
		U.push(U[i]! + h);
	}
	const total = U[segs]!;
	if (!(total > 0))
		return null;

	// δ_i = (P_{i+1} - P_i) / h_i
	const D: DwgPoint[] = [];
	for (let i = 0; i < segs; i++) {
		const a = P[i]!;
		const b = P[i + 1]!;
		const h = H[i]!;
		D.push({ x: (b.x - a.x) / h, y: (b.y - a.y) / h });
	}

	const n = segs; // 未知量 M_0..M_n
	const sub = Array.from({ length: n + 1 }, () => 0);
	const diag = Array.from({ length: n + 1 }, () => 1);
	const sup = Array.from({ length: n + 1 }, () => 0);
	const rhx = Array.from({ length: n + 1 }, () => 0);
	const rhy = Array.from({ length: n + 1 }, () => 0);

	const clampStart = !!startTangent && Number.isFinite(startTangent.x) && Number.isFinite(startTangent.y);
	const clampEnd = !!endTangent && Number.isFinite(endTangent.x) && Number.isFinite(endTangent.y);

	if (clampStart) {
		// 2M_0 + M_1 = 6(δ_0 - T0)/h_0
		diag[0] = 2;
		sup[0] = 1;
		rhx[0] = (6 * (D[0]!.x - startTangent!.x)) / H[0]!;
		rhy[0] = (6 * (D[0]!.y - startTangent!.y)) / H[0]!;
	}
	else {
		diag[0] = 1;
	}
	for (let i = 1; i < n; i++) {
		sub[i] = H[i - 1]! / 6;
		diag[i] = (H[i - 1]! + H[i]!) / 3;
		sup[i] = H[i]! / 6;
		rhx[i] = D[i]!.x - D[i - 1]!.x;
		rhy[i] = D[i]!.y - D[i - 1]!.y;
	}
	if (clampEnd) {
		// M_{n-1} + 2M_n = 6(T1 - δ_{n-1})/h_{n-1}
		sub[n] = 1;
		diag[n] = 2;
		rhx[n] = (6 * (endTangent!.x - D[n - 1]!.x)) / H[n - 1]!;
		rhy[n] = (6 * (endTangent!.y - D[n - 1]!.y)) / H[n - 1]!;
	}
	else {
		diag[n] = 1;
	}

	const Mx = solveTridiagonal(sub, diag, sup, rhx);
	const My = solveTridiagonal(sub, diag, sup, rhy);
	if (!Mx || !My)
		return null;

	const fn: CurveFn = (t) => {
		const u = Math.min(Math.max(t, 0), total);
		let i = segs - 1;
		for (let k = 0; k < segs; k++) {
			if (u <= U[k + 1]!) {
				i = k;
				break;
			}
		}
		const h = H[i]!;
		const s = u - U[i]!;
		const a = P[i]!;
		const b = P[i + 1]!;
		const mx = Mx[i]!;
		const mx1 = Mx[i + 1]!;
		const my = My[i]!;
		const my1 = My[i + 1]!;
		const t1 = (h - s);
		return {
			x: (mx * t1 * t1 * t1) / (6 * h)
				+ (mx1 * s * s * s) / (6 * h)
				+ (a.x / h - (mx * h) / 6) * t1
				+ (b.x / h - (mx1 * h) / 6) * s,
			y: (my * t1 * t1 * t1) / (6 * h)
				+ (my1 * s * s * s) / (6 * h)
				+ (a.y / h - (my * h) / 6) * t1
				+ (b.y / h - (my1 * h) / 6) * s,
		};
	};

	return { fn, t0: 0, t1: total };
}

/** Thomas 算法解三对角方程；对角元退化时返回 null。 */
function solveTridiagonal(
	sub: ReadonlyArray<number>,
	diag: ReadonlyArray<number>,
	sup: ReadonlyArray<number>,
	rhs: ReadonlyArray<number>,
): number[] | null {
	const n = diag.length;
	const c = Array.from({ length: n }, () => 0);
	const d = Array.from({ length: n }, () => 0);
	const denom0 = diag[0]!;
	if (Math.abs(denom0) < 1e-14)
		return null;
	c[0] = sup[0]! / denom0;
	d[0] = rhs[0]! / denom0;
	for (let i = 1; i < n; i++) {
		const m = diag[i]! - sub[i]! * c[i - 1]!;
		if (Math.abs(m) < 1e-14)
			return null;
		c[i] = sup[i]! / m;
		d[i] = (rhs[i]! - sub[i]! * d[i - 1]!) / m;
	}
	const x = Array.from({ length: n }, () => 0);
	x[n - 1] = d[n - 1]!;
	for (let i = n - 2; i >= 0; i--)
		x[i] = d[i]! - c[i]! * x[i + 1]!;
	return x.every(Number.isFinite) ? x : null;
}

/** 自适应二分采样：判据为「中点到弦的距离 / 弦长 ≤ tolRatio」。 */
function adaptiveSample(ev: Evaluator, tolRatio: number, minSegments: number, limit: number): DwgPoint[] {
	const p0 = ev.fn(ev.t0);
	const p1 = ev.fn(ev.t1);
	if (!isFinitePoint(p0) || !isFinitePoint(p1))
		return [];

	const out: DwgPoint[] = [p0];
	// 先均匀分到 minSegments，保证再平滑的曲线也有足够分辨率
	for (let i = 1; i <= minSegments; i++) {
		const ta = ev.t0 + ((ev.t1 - ev.t0) * (i - 1)) / minSegments;
		const tb = ev.t0 + ((ev.t1 - ev.t0) * i) / minSegments;
		refine(ev, ta, ev.fn(ta), tb, ev.fn(tb), tolRatio, 0, out, limit);
	}
	// 注意：这里**不截断**。输出长度可以超过 limit（limit 只是「早停信号」），
	// 由 sampleWithBudget 判断超预算后放松容差重采；截断会丢曲线尾段与端点。
	return out;
}

function refine(
	ev: Evaluator,
	ta: number,
	pa: DwgPoint,
	tb: number,
	pb: DwgPoint,
	tolRatio: number,
	depth: number,
	out: DwgPoint[],
	limit: number,
): void {
	// 到达硬上限即停止细分（此时输出长度已超预算，由上层放松容差重采）
	if (out.length >= limit)
		return;
	const chord = Math.hypot(pb.x - pa.x, pb.y - pa.y);
	const tm = (ta + tb) / 2;
	const pm = ev.fn(tm);
	if (!isFinitePoint(pm) || chord < EPS_DIST || depth >= MAX_DEPTH) {
		out.push(pb);
		return;
	}
	const dev = distanceToSegment(pm, pa, pb);
	// 弦长足够短时也停：此时绝对偏差必然很小，继续分只增加点数
	if (dev <= tolRatio * chord || chord <= EPS_DIST) {
		out.push(pb);
		return;
	}
	refine(ev, ta, pa, tm, pm, tolRatio, depth + 1, out, limit);
	refine(ev, tm, pm, tb, pb, tolRatio, depth + 1, out, limit);
}

/** 点到线段的距离。 */
function distanceToSegment(p: DwgPoint, a: DwgPoint, b: DwgPoint): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len2 = dx * dx + dy * dy;
	if (len2 < EPS_DIST * EPS_DIST)
		return Math.hypot(p.x - a.x, p.y - a.y);
	const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
	return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function isFinitePoint(p: DwgPoint | undefined): p is DwgPoint {
	return !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
}

/** 去掉相邻重复点与非有限点。 */
function dedupe(points: ReadonlyArray<DwgPoint>): DwgPoint[] {
	const out: DwgPoint[] = [];
	for (const p of points) {
		if (!isFinitePoint(p))
			continue;
		const last = out[out.length - 1];
		if (last && Math.abs(last.x - p.x) < EPS_DIST && Math.abs(last.y - p.y) < EPS_DIST)
			continue;
		out.push({ x: p.x, y: p.y });
	}
	return out;
}
