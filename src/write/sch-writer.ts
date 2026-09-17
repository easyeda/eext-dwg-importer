/**
 * SCH 写入器：把 IR 实体写到当前原理图文档。
 *
 * 单位：SCH 数据层单位是 0.01 inch (= 10 mil)，写图元前做单位换算。
 *
 * API 形状对照 pro-api-types 核实：
 * - Wire.create(line: number[] | number[][], net?, color?, lineWidth?, lineType?)
 * - Polygon.create(line: number[], color?, fillColor?, lineWidth?, lineType?)
 * - Circle.create(cx, cy, radius, color?, fillColor?, lineWidth?, lineType?, fillStyle?)
 * - Arc.create(startX, startY, referenceX, referenceY, endX, endY, ...)
 *     即「起点 + 参考点（圆心）+ 终点」，不是圆心/半径/角度。
 * - Text.create(x, y, content, rotation?, textColor?, fontName?, fontSize?, ...)
 *
 * line 参数为扁平坐标数组 [x1, y1, x2, y2, ...]。
 */

import type {
	ApplyImportPayload,
	ApplyImportResult,
	DwgEntity,
	DwgPoint,
} from '../shared/types';
import { edaApi } from '../shared/eda-api';
import { dwgToMil, MIL_PER_100TH_INCH, radToDeg } from '../shared/units';

export async function applySchImport(
	payload: ApplyImportPayload,
	onProgress: (done: number, total: number) => void,
): Promise<ApplyImportResult> {
	const result: ApplyImportResult = { successCount: 0, failedCount: 0, errors: [] };
	const total = payload.ir.entities.length;
	const ctx: SchCtx = {
		units: payload.options.units === 'auto' ? payload.ir.units : payload.options.units,
		enabled: payload.options.enabledKinds,
		mapping: payload.mapping,
		emptyLayers: new Set(payload.ir.layers.filter(l => l.entityCount === 0).map(l => l.name)),
		skipEmpty: payload.options.skipEmptyLayers,
		lineWidth: payload.options.defaultLineWidthMil / MIL_PER_100TH_INCH,
	};

	for (let i = 0; i < total; i++) {
		await writeSchOne(payload.ir.entities[i]!, ctx, result);
		if (i % 10 === 0)
			onProgress(i, total);
	}
	onProgress(total, total);
	return result;
}

interface SchCtx {
	units: 'mm' | 'inch' | 'unknown';
	enabled: ReadonlySet<string>;
	mapping: Record<string, number | null>;
	emptyLayers: Set<string>;
	skipEmpty: boolean;
	lineWidth: number;
}

function toSchUnit(valueInDwg: number, units: SchCtx['units']): number {
	return dwgToMil(valueInDwg, units) / MIL_PER_100TH_INCH;
}

async function writeSchOne(e: DwgEntity, ctx: SchCtx, result: ApplyImportResult): Promise<void> {
	const eda = edaApi();
	if (!eda)
		return;

	const targetLayer = ctx.mapping[e.layer];
	if (targetLayer === undefined || targetLayer === null)
		return;
	if (ctx.skipEmpty && ctx.emptyLayers.has(e.layer))
		return;
	if (!ctx.enabled.has(e.kind))
		return;

	const U = (v: number): number => toSchUnit(v, ctx.units);

	try {
		switch (e.kind) {
			case 'LINE':
				await eda.sch_PrimitiveWire?.create?.(
					[U(e.start.x), U(e.start.y), U(e.end.x), U(e.end.y)],
					undefined,
					null,
					ctx.lineWidth,
				);
				break;

			case 'CIRCLE':
				await eda.sch_PrimitiveCircle?.create?.(
					U(e.center.x),
					U(e.center.y),
					U(e.radius),
					null,
					null,
					ctx.lineWidth,
				);
				break;

			case 'ARC': {
				// SCH ARC 需要「起点 + 参考点（圆心）+ 终点」。
				const p1 = pointOnCircle(e.center, e.radius, e.startAngle);
				const p2 = pointOnCircle(e.center, e.radius, e.endAngle);
				await eda.sch_PrimitiveArc?.create?.(
					U(p1.x),
					U(p1.y),
					U(e.center.x),
					U(e.center.y),
					U(p2.x),
					U(p2.y),
					null,
					null,
					ctx.lineWidth,
				);
				break;
			}

			case 'LWPOLYLINE':
			case 'POLYLINE':
			case 'SPLINE': {
				if (e.points.length < 2)
					break;
				const flat: number[] = [];
				for (const p of e.points) {
					flat.push(U(p.x), U(p.y));
				}
				await eda.sch_PrimitivePolygon?.create?.(flat, null, null, ctx.lineWidth);
				break;
			}

			case 'TEXT':
			case 'MTEXT':
				await eda.sch_PrimitiveText?.create?.(
					U(e.position.x),
					U(e.position.y),
					e.content,
					radToDeg(e.rotation),
					null,
					null,
					Math.max(1, U(e.height) * 0.8),
				);
				break;
		}
		result.successCount += 1;
	}
	catch (err) {
		result.failedCount += 1;
		result.errors.push({ entityId: e.id, message: (err as Error).message });
	}
}

function pointOnCircle(center: DwgPoint, radius: number, angleRad: number): DwgPoint {
	return {
		x: center.x + Math.cos(angleRad) * radius,
		y: center.y + Math.sin(angleRad) * radius,
	};
}
