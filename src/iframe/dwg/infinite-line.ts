/**
 * 无限长构造线（DWG 的 XLINE / RAY）→ 有限线段。
 *
 * 背景（实测 case/example_2018.dwg）：
 *   图纸里有 XLINE ×1、RAY ×2，只有 `firstPoint`（基点）与 `unitDirection`
 *   （单位方向），没有端点——它们是「无限长」的辅助/构造线，CAD 里贯穿整个视口。
 *   此前这两类完全没有处理，用户表现为「斜线有没导入的」。
 *
 * EDA 侧没有无限长图元，故：
 *   1. 解析时先按基点 ± INFINITE_EXTENT 生成两个假端点，让它能像普通 LINE 一样
 *      走 BLOCK 的仿射变换（缩放/旋转/镜像都自动正确）；
 *   2. 全部实体就位后，用 Liang-Barsky 裁剪到图纸包围盒（外扩一点），
 *      得到「贯穿图纸」的线段——与 CAD 里的观感一致。
 *
 * 裁剪放在解析阶段而不是写成超长线段：
 *   超长线段会被离群过滤当成跑飞线剔除（outlier.ts 正是按到中心距离判的），
 *   且导入后会把画布视野拉到 ±1e6，用户什么都看不见。
 */

import type { DwgBoundingBox, DwgPoint } from '../../shared/types';

/**
 * 假端点前推距离（图纸单位）。
 *
 * 取 1e6：远大于任何真实图纸尺寸（实测最大约 1.4 万），
 * 又小到 double 不会丢精度——即使块缩放 3256 倍（实测遇到的极端倍率），
 * 1e6 × 3256 = 3.256e9，其 ULP 约 5e-7，裁剪回图纸尺度后仍远优于 1e-3。
 */
export const INFINITE_EXTENT = 1e6;

/** 由基点与单位方向生成假端点；方向退化时返回 null。 */
export function infiniteLineEndpoints(
	origin: DwgPoint,
	direction: DwgPoint,
	extent: number = INFINITE_EXTENT,
): { start: DwgPoint; end: DwgPoint } | null {
	const len = Math.hypot(direction.x, direction.y);
	if (!Number.isFinite(len) || len < 1e-12)
		return null;
	const ux = direction.x / len;
	const uy = direction.y / len;
	if (!Number.isFinite(ux) || !Number.isFinite(uy))
		return null;
	return {
		start: { x: origin.x - ux * extent, y: origin.y - uy * extent },
		end: { x: origin.x + ux * extent, y: origin.y + uy * extent },
	};
}

/**
 * Liang-Barsky 线段裁剪：把线段裁到矩形内。
 *
 * 选它而非「求交点再排序」：逐边参数化裁剪天然处理平行/退化情形，
 * 不会出现除零或缺失交点；完全在框外时返回 null（该构造线在图纸范围外，无导入价值）。
 *
 * `padRatio` 是按框的较大边长做外扩的比例，保证贴着图框的构造线不被裁没。
 */
export function clipLineToBox(
	start: DwgPoint,
	end: DwgPoint,
	box: DwgBoundingBox,
	padRatio = 0.02,
): { start: DwgPoint; end: DwgPoint } | null {
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	if (!Number.isFinite(dx) || !Number.isFinite(dy))
		return null;

	const spanX = Math.abs(box.maxX - box.minX);
	const spanY = Math.abs(box.maxY - box.minY);
	const pad = Math.max(spanX, spanY) * padRatio;
	const x0 = Math.min(box.minX, box.maxX) - pad;
	const x1 = Math.max(box.minX, box.maxX) + pad;
	const y0 = Math.min(box.minY, box.maxY) - pad;
	const y1 = Math.max(box.minY, box.maxY) + pad;

	// 参数区间：p·t <= q（Liang-Barsky 标准形式）
	const p = [-dx, dx, -dy, dy];
	const q = [start.x - x0, x1 - start.x, start.y - y0, y1 - start.y];
	let t0 = 0;
	let t1 = 1;
	for (let i = 0; i < 4; i++) {
		const pi = p[i]!;
		const qi = q[i]!;
		if (Math.abs(pi) < 1e-12) {
			// 与该边平行：完全落在外侧则整条线不可见
			if (qi < 0)
				return null;
			continue;
		}
		const r = qi / pi;
		if (pi < 0) {
			if (r > t1)
				return null;
			if (r > t0)
				t0 = r;
		}
		else {
			if (r < t0)
				return null;
			if (r < t1)
				t1 = r;
		}
	}
	const out = {
		start: { x: start.x + dx * t0, y: start.y + dy * t0 },
		end: { x: start.x + dx * t1, y: start.y + dy * t1 },
	};
	// 裁剪后退化成一个点说明只是与框角相切，没有可见长度
	if (Math.hypot(out.end.x - out.start.x, out.end.y - out.start.y) < 1e-9)
		return null;
	return out;
}
