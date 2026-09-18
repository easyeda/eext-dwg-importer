/**
 * 圆弧采样工具（纯几何，无 EDA 依赖）。
 *
 * 为什么不固定段数：同一张 DWG 里既有半径零点几的细小齿形，也有半径几十的圆角，
 * 固定段数要么把大弧画成折线，要么给细齿浪费上万点。这里用**尺度无关**的
 * 「矢高 / 弦长」相对误差来定段数：
 *
 *   单段扫掠角为 2a 时，弦长 chord = 2r·sin(a)，矢高 sagitta = r·(1 − cos(a))
 *   → sagitta / chord = (1 − cos a) / (2 sin a) = tan(a/2) / 2
 *   令其 ≤ tolRatio，得 a ≤ 2·atan(2·tolRatio)
 *
 * tolRatio = 0.02 时每段扫掠角上限约 9.2°（半径 100 的弧，单段弦长误差约 0.02 单位）。
 * 实测依据（case/example_2000.dwg+libredwg DXF 真值）：多段线凸度 bulge=−0.52056705
 * 对应 110° 的弧段，按此容差需 12 段，上限截到 8 段时相对误差约 3%（可见性良好）。
 */

/** 单段扫掠角上限（弧度）：由容差反解，见文件头推导。 */
function maxSegmentAngle(tolRatio: number): number {
	// 2·atan(2·tolRatio) 是「半角」上限，乘以 2 得到整段扫掠角上限
	return 4 * Math.atan(2 * tolRatio);
}

/**
 * 按矢高容差求圆弧采样的段数。
 *
 * @param sweepRad 圆弧扫掠角（弧度，取绝对值参与计算）
 * @param tolRatio 矢高 / 弦长 的相对误差上限（默认 2%）
 * @param maxSegments 段数上限（避免大弧产生过多点）
 * @param minSegments 段数下限
 */
export function arcSegmentsForSweep(sweepRad: number, tolRatio = 0.02, maxSegments = 8, minSegments = 1): number {
	const sweep = Math.abs(sweepRad);
	if (!Number.isFinite(sweep) || sweep <= 0 || !(tolRatio > 0))
		return minSegments;
	const step = maxSegmentAngle(tolRatio);
	const n = Math.ceil(sweep / step);
	return Math.max(minSegments, Math.min(maxSegments, n));
}
