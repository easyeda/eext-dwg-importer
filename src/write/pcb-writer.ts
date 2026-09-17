/**
 * PCB / Footprint 写入器：把 IR 实体批量写到当前 PCB 文档。
 *
 * Footprint 编辑器复用 pcb_Primitive* API，故 fp-writer 转发到此。
 *
 * 单位：EDA PCB 数据层单位是 mil；DWG 坐标按 IR.units 换算。
 * 角度：EDA ARC 用角度，DWG ARC 用弧度。
 */

import type {
	ApplyImportPayload,
	ApplyImportResult,
	DwgEntity,
	DwgPoint,
	LayerMapping,
} from '../shared/types';
import { edaApi } from '../shared/eda-api';
import { dwgToMil, radToDeg } from '../shared/units';

const BATCH = 50;

export async function applyPcbImport(
	payload: ApplyImportPayload,
	onProgress: (done: number, total: number) => void,
): Promise<ApplyImportResult> {
	const result: ApplyImportResult = { successCount: 0, failedCount: 0, errors: [] };
	const total = payload.ir.entities.length;
	const emptyLayers = new Set(payload.ir.layers.filter(l => l.entityCount === 0).map(l => l.name));

	const context: WriteContext = {
		units: payload.options.units === 'auto' ? payload.ir.units : payload.options.units,
		enabled: payload.options.enabledKinds,
		width: payload.options.defaultLineWidthMil,
		mapping: payload.mapping,
		skipEmptyLayers: payload.options.skipEmptyLayers,
		emptyLayers,
	};

	for (let i = 0; i < total; i += BATCH) {
		const slice = payload.ir.entities.slice(i, i + BATCH);
		await Promise.all(slice.map(e => writeOne(e, context, result)));
		onProgress(Math.min(i + BATCH, total), total);
	}
	return result;
}

interface WriteContext {
	units: 'mm' | 'inch' | 'unknown';
	enabled: ReadonlySet<string>;
	width: number;
	mapping: LayerMapping;
	skipEmptyLayers: boolean;
	emptyLayers: Set<string>;
}

async function writeOne(e: DwgEntity, ctx: WriteContext, result: ApplyImportResult): Promise<void> {
	const eda = edaApi();
	if (!eda)
		return;
	const targetLayer = ctx.mapping[e.layer];
	if (targetLayer === undefined || targetLayer === null)
		return;
	if (ctx.skipEmptyLayers && ctx.emptyLayers.has(e.layer))
		return;
	if (!ctx.enabled.has(e.kind))
		return;

	try {
		switch (e.kind) {
			case 'LINE':
				await eda.pcb_PrimitiveLine?.create?.(
					'',
					targetLayer,
					dwgToMil(e.start.x, ctx.units),
					dwgToMil(e.start.y, ctx.units),
					dwgToMil(e.end.x, ctx.units),
					dwgToMil(e.end.y, ctx.units),
					ctx.width,
					false,
				);
				break;
			case 'CIRCLE': {
				const pts = circleAsPolyline(e.center, e.radius, ctx);
				await eda.pcb_PrimitivePolyline?.create?.(pts, ctx.width, targetLayer, false);
				break;
			}
			case 'ARC':
				await eda.pcb_PrimitiveArc?.create?.(
					targetLayer,
					dwgToMil(e.center.x, ctx.units),
					dwgToMil(e.center.y, ctx.units),
					dwgToMil(e.radius, ctx.units),
					radToDeg(e.startAngle),
					radToDeg(e.endAngle),
					ctx.width,
					'',
					false,
				);
				break;
			case 'LWPOLYLINE':
			case 'POLYLINE':
			case 'SPLINE': {
				const pts = e.points.map(p => ({
					x: dwgToMil(p.x, ctx.units),
					y: dwgToMil(p.y, ctx.units),
				}));
				if (e.closed && pts.length > 0 && pts.length <= 256) {
					await eda.pcb_PrimitiveRegion?.create?.(pts, targetLayer, false);
				}
				else {
					await eda.pcb_PrimitivePolyline?.create?.(pts, ctx.width, targetLayer, false);
				}
				break;
			}
			case 'TEXT':
			case 'MTEXT':
				await eda.pcb_PrimitiveString?.create?.(
					dwgToMil(e.position.x, ctx.units),
					dwgToMil(e.position.y, ctx.units),
					e.content,
					targetLayer,
					dwgToMil(e.height, ctx.units) * 0.8,
					radToDeg(e.rotation),
					false,
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

function circleAsPolyline(
	center: DwgPoint,
	radius: number,
	ctx: WriteContext,
	segments = 32,
): DwgPoint[] {
	const pts: DwgPoint[] = [];
	for (let i = 0; i < segments; i++) {
		const a = (i / segments) * Math.PI * 2;
		pts.push({
			x: dwgToMil(center.x + Math.cos(a) * radius, ctx.units),
			y: dwgToMil(center.y + Math.sin(a) * radius, ctx.units),
		});
	}
	return pts;
}
