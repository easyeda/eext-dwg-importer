/**
 * 单位换算：DWG 数据层 (mm/inch) ↔ EDA 数据层 (mil)。
 *
 * - PCB / Footprint 编辑器数据坐标单位是 mil (1/1000 inch)。
 * - SCH 编辑器数据坐标单位是 0.01 inch (= 10 mil)，由调用方另行换算。
 *
 * 角度：EDA pcb_PrimitiveArc.create 用角度；DWG ARC 用弧度。本文件只做长度换算，角度换算在 writer 中处理。
 */

import type { DwgUnit } from './types';

export const MIL_PER_MM = 1000 / 25.4; // 1 mm ≈ 39.3701 mil
export const MIL_PER_INCH = 1000; // 1 inch = 1000 mil
export const MIL_PER_100TH_INCH = 10; // SCH 单位 = 0.01 inch = 10 mil

export const MM_PER_MIL = 1 / MIL_PER_MM;
export const INCH_PER_MIL = 1 / MIL_PER_INCH;

export function mmToMil(mm: number): number {
	return mm * MIL_PER_MM;
}

export function inchToMil(inch: number): number {
	return inch * MIL_PER_INCH;
}

/**
 * 把 DWG 数据层坐标换算为 mil。
 * 'unknown' 视为 mm（保守默认，多数 CAD 输出为 mm）。
 */
export function dwgToMil(valueInDwgUnit: number, units: DwgUnit): number {
	switch (units) {
		case 'mm': return mmToMil(valueInDwgUnit);
		case 'inch': return inchToMil(valueInDwgUnit);
		case 'unknown': return mmToMil(valueInDwgUnit);
	}
}

/** 弧度 → 角度。 */
export function radToDeg(rad: number): number {
	return (rad * 180) / Math.PI;
}

/** 角度 → 弧度。 */
export function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}
