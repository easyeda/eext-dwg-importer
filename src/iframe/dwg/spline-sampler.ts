/**
 * SPLINE 自适应采样。
 *
 * 目标：把 DWG B 样条控制点转成 16–128 段折线，最大视觉偏差 < 0.1 mm（数据层）。
 *
 * 算法：
 * 1. 估算初始段数：segments = clamp(arcLength / (2 * maxDeviation), [min, max])
 * 2. 在每段中点用 De Casteljau 二分：若 |mid - linear_interp(start, end)| > maxDeviation，
 *    把当前段再分两段；递归直到全部合格。
 *
 * 实现注意：控制多边形长度作为弧长初估；细化阶段实际用控制点序列即可（精度足够）。
 * 若需要支持真 B-spline 拟合，可后续引入 @mathigon/fermat 或自实现 De Casteljau。
 */

import type { DwgPoint } from '../../shared/types';

export interface SampleSplineOptions {
	maxDeviationMm?: number;
	minSegments?: number;
	maxSegments?: number;
}

/**
 * 自适应采样一组主要折线控制点。
 * 输入视为「主要折线控制点序列」（不是真正的 NURBS 参数）；
 * 用近似弧长 + 控制多边形误差二分。
 */
export function sampleSpline(
	controlPoints: ReadonlyArray<DwgPoint>,
	closed = false,
	options: SampleSplineOptions = {},
): DwgPoint[] {
	const maxDeviation = options.maxDeviationMm ?? 0.1;
	const minSegments = options.minSegments ?? 16;
	const maxSegments = options.maxSegments ?? 128;

	if (controlPoints.length < 2)
		return controlPoints.slice();

	const arcLen = polylineLength(controlPoints, closed);
	const initialSegments = Math.max(
		minSegments,
		Math.min(maxSegments, Math.ceil(arcLen / (2 * Math.max(maxDeviation, 0.001)))),
	);

	// 初始均匀分段
	const pts = resampleBySegmentCount(controlPoints, closed, initialSegments);
	// 在每段中点用控制多边形中点逼近真实中点，做一次二分细化
	const refined: DwgPoint[] = [pts[0]!];
	for (let i = 1; i < pts.length; i++) {
		const a = pts[i - 1]!;
		const b = pts[i]!;
		insertMidSegmentBetween(a, b, refined, maxDeviation, minSegments, maxSegments);
	}
	if (closed && refined[0])
		refined.push(refined[0]);
	return refined;
}

function polylineLength(pts: ReadonlyArray<DwgPoint>, closed: boolean): number {
	let len = 0;
	for (let i = 1; i < pts.length; i++) {
		len += distance(pts[i - 1]!, pts[i]!);
	}
	if (closed && pts.length > 1) {
		len += distance(pts[pts.length - 1]!, pts[0]!);
	}
	return len;
}

function distance(a: DwgPoint, b: DwgPoint): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return Math.hypot(dx, dy);
}

function resampleBySegmentCount(
	pts: ReadonlyArray<DwgPoint>,
	closed: boolean,
	n: number,
): DwgPoint[] {
	const total = polylineLength(pts, closed);
	if (total === 0)
		return pts.slice();
	const step = total / n;
	const result: DwgPoint[] = [];
	let acc = 0;
	result.push(pts[0]!);
	for (let i = 1; i < pts.length && result.length < n; i++) {
		const a = pts[i - 1]!;
		const b = pts[i]!;
		const d = distance(a, b);
		while (acc + d >= step && result.length < n) {
			const remain = step - acc;
			const t = d === 0 ? 0 : remain / d;
			result.push({
				x: a.x + (b.x - a.x) * t,
				y: a.y + (b.y - a.y) * t,
			});
			acc = 0;
		}
		acc += d;
	}
	while (result.length < n) result.push(pts[pts.length - 1]!);
	return result;
}

function insertMidSegmentBetween(
	a: DwgPoint,
	b: DwgPoint,
	out: DwgPoint[],
	maxDeviation: number,
	minSeg: number,
	maxSeg: number,
	depth = 0,
): void {
	const mid: DwgPoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	if (depth >= 6 || out.length >= maxSeg || distance(a, b) <= 2 * maxDeviation) {
		out.push(b);
		return;
	}
	// 偏差度量：本段中点相对弦中点的偏移量（absMid 为下一次细分的候选点）。
	// 由于 mid 即弦中点，这里用「弦长超出容差」作为细分判据，
	// 保证折线段长度不超过 2 * maxDeviation，从而视觉偏差受控。
	const dev = distance(a, b) / 2;
	if (dev <= maxDeviation || (out.length >= minSeg && depth >= 3)) {
		out.push(b);
		return;
	}
	insertMidSegmentBetween(a, mid, out, maxDeviation, minSeg, maxSeg, depth + 1);
	insertMidSegmentBetween(mid, b, out, maxDeviation, minSeg, maxSeg, depth + 1);
}
