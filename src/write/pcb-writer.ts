/**
 * PCB / Footprint 写入器：把 IR 实体批量写到当前 PCB 文档。
 *
 * Footprint 编辑器复用 pcb_Primitive* API，故 fp-writer 转发到此。
 *
 * 单位：EDA PCB 数据层单位是 mil；DWG 坐标按 IR.units 换算。
 * 角度：EDA ARC 用角度，DWG ARC 用弧度。
 *
 * API 形状对照 pro-api-types 核实（不要臆测）：
 * - Line.create(net, layer, x1, y1, x2, y2, lineWidth?, locked?)
 * - Polyline.create(net, layer, polygon: IPCB_Polygon, lineWidth?, locked?)
 * - Region.create(layer, complexPolygon: IPCB_ComplexPolygon, ruleType?, name?, lineWidth?, locked?)
 * - Arc.create(net, layer, startX, startY, endX, endY, arcAngle, lineWidth?, mode?, locked?)
 *     注意 Arc 用「两端点 + 圆弧角」，不是「圆心 + 半径 + 起止角」。
 * - String.create(layer, x, y, text, fontFamily, fontSize, lineWidth, alignMode,
 *                 rotation, reverse, expansion, mirror, locked)
 * 多边形通过 eda.pcb_MathPolygon.createPolygon(['L', x1, y1, x2, y2, ...]) 构造。
 */

import type { PcbPolygonSource } from '../shared/eda-api';
import type {
	ApplyImportPayload,
	ApplyImportResult,
	DwgEntity,
	LayerMapping,
} from '../shared/types';
import { edaApi } from '../shared/eda-api';
import { dwgToMil, radToDeg } from '../shared/units';

const BATCH = 50;
/** EPCB_PrimitiveStringAlignMode：左对齐。 */
const STRING_ALIGN_LEFT = 0;
const DEFAULT_FONT = 'Arial';

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

	const X = (v: number): number => dwgToMil(v, ctx.units);
	const mkPolygon = (points: Array<{ x: number; y: number }>): PcbPolygonSource | undefined => {
		if (points.length < 2)
			return undefined;
		const src: PcbPolygonSource = ['L'];
		for (const p of points) {
			src.push(X(p.x), X(p.y));
		}
		return src;
	};

	try {
		switch (e.kind) {
			case 'LINE':
				await eda.pcb_PrimitiveLine?.create?.(
					'',
					targetLayer,
					X(e.start.x),
					X(e.start.y),
					X(e.end.x),
					X(e.end.y),
					ctx.width,
					false,
				);
				break;

			case 'ARC': {
				// EDA 的 ARC 需要两端点 + 圆弧角，故先由圆心/半径/起止角算出两端点。
				const p1 = pointOnCircle(e.center, e.radius, e.startAngle);
				const p2 = pointOnCircle(e.center, e.radius, e.endAngle);
				let sweepDeg = radToDeg(e.endAngle - e.startAngle);
				// 归一化到 (-360, 360)，负值表示顺时针。
				while (sweepDeg > 360) sweepDeg -= 360;
				while (sweepDeg < -360) sweepDeg += 360;
				await eda.pcb_PrimitiveArc?.create?.(
					'',
					targetLayer,
					X(p1.x),
					X(p1.y),
					X(p2.x),
					X(p2.y),
					sweepDeg,
					ctx.width,
					undefined,
					false,
				);
				break;
			}

			case 'CIRCLE':
			case 'LWPOLYLINE':
			case 'POLYLINE':
			case 'SPLINE': {
				const pts = e.kind === 'CIRCLE'
					? circlePoints(e.center, e.radius, 64)
					: e.points;
				const src = mkPolygon(pts);
				if (!src)
					break;
				const polygon = eda.pcb_MathPolygon?.createPolygon?.(src);
				if (!polygon)
					break;
				await eda.pcb_PrimitivePolyline?.create?.('', targetLayer, polygon, ctx.width, false);
				break;
			}

			case 'TEXT':
			case 'MTEXT':
				await eda.pcb_PrimitiveString?.create?.(
					targetLayer,
					X(e.position.x),
					X(e.position.y),
					e.content,
					DEFAULT_FONT,
					// EDA 的 font 尺寸语义与 DWG 文本高度不同，取 0.8 系数做视觉对齐。
					Math.max(1, X(e.height) * 0.8),
					ctx.width,
					STRING_ALIGN_LEFT,
					radToDeg(e.rotation),
					false,
					0,
					false,
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

function pointOnCircle(center: { x: number; y: number }, radius: number, angleRad: number): { x: number; y: number } {
	return {
		x: center.x + Math.cos(angleRad) * radius,
		y: center.y + Math.sin(angleRad) * radius,
	};
}

function circlePoints(center: { x: number; y: number }, radius: number, segments: number): Array<{ x: number; y: number }> {
	const pts: Array<{ x: number; y: number }> = [];
	for (let i = 0; i < segments; i++) {
		pts.push(pointOnCircle(center, radius, (i / segments) * Math.PI * 2));
	}
	// 闭合
	pts.push(pts[0]!);
	return pts;
}
