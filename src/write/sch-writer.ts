/**
 * SCH 写入器：把 IR 实体写到当前原理图文档。
 *
 * 单位：SCH 数据层单位是 0.01 inch (= 10 mil)，写图元前做单位换算。
 *
 * EDA SCH 图元类型与 PCB 略有不同；本 v1 实现支持 LINE / POLYLINE / CIRCLE / ARC / TEXT。
 * sch_PrimitiveWire (for LINE)、sch_PrimitivePolygon (for polyline/circle)、
 * sch_PrimitiveArc、sch_PrimitiveText 是常用 API。
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
	const ctx = {
		units: payload.options.units === 'auto' ? payload.ir.units : payload.options.units,
		enabled: payload.options.enabledKinds,
		mapping: payload.mapping,
		emptyLayers: new Set(payload.ir.layers.filter(l => l.entityCount === 0).map(l => l.name)),
		skipEmpty: payload.options.skipEmptyLayers,
	};

	for (let i = 0; i < total; i++) {
		const e = payload.ir.entities[i]!;
		await writeSchOne(e, ctx, result);
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

	try {
		switch (e.kind) {
			case 'LINE':
				await eda.sch_PrimitiveWire?.create?.(
					toSchUnit(e.start.x, ctx.units),
					toSchUnit(e.start.y, ctx.units),
					toSchUnit(e.end.x, ctx.units),
					toSchUnit(e.end.y, ctx.units),
				);
				break;
			case 'CIRCLE':
			case 'LWPOLYLINE':
			case 'POLYLINE':
			case 'SPLINE': {
				const pts = collectPolylinePoints(e);
				if (pts.length > 0) {
					await eda.sch_PrimitivePolygon?.create?.(
						pts.map(p => ({
							x: toSchUnit(p.x, ctx.units),
							y: toSchUnit(p.y, ctx.units),
						})),
					);
				}
				break;
			}
			case 'ARC':
				await eda.sch_PrimitiveArc?.create?.(
					toSchUnit(e.center.x, ctx.units),
					toSchUnit(e.center.y, ctx.units),
					toSchUnit(e.radius, ctx.units),
					radToDeg(e.startAngle),
					radToDeg(e.endAngle),
				);
				break;
			case 'TEXT':
			case 'MTEXT':
				await eda.sch_PrimitiveText?.create?.(
					toSchUnit(e.position.x, ctx.units),
					toSchUnit(e.position.y, ctx.units),
					e.content,
					toSchUnit(e.height, ctx.units) * 0.8,
					radToDeg(e.rotation),
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

function collectPolylinePoints(e: DwgEntity): DwgPoint[] {
	if (e.kind === 'CIRCLE') {
		const pts: DwgPoint[] = [];
		const segments = 32;
		for (let i = 0; i < segments; i++) {
			const a = (i / segments) * Math.PI * 2;
			pts.push({ x: e.center.x + Math.cos(a) * e.radius, y: e.center.y + Math.sin(a) * e.radius });
		}
		return pts;
	}
	if (e.kind === 'LWPOLYLINE' || e.kind === 'POLYLINE' || e.kind === 'SPLINE') {
		return e.points;
	}
	return [];
}
