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
 *
 * ⚠️ 失败必须可见：所有 create() 返回 `Promise<ISCH_* | undefined>`，
 * undefined 表示创建失败。统一经 countCreated() 检查返回值，
 * 并在导入开始前做环境预检（缺 API 直接抛错），杜绝「静默 0 导入」。
 */

import type { EdaGlobals } from '../shared/eda-api';
import type {
	ApplyImportPayload,
	ApplyImportResult,
	DwgEntity,
	DwgEntityKind,
	DwgPoint,
	DwgUnit,
} from '../shared/types';
import { edaApi } from '../shared/eda-api';
import { dwgToMil, MIL_PER_100TH_INCH, radToDeg } from '../shared/units';
import { countCreated, pushError } from './apply-result';

export async function applySchImport(
	payload: ApplyImportPayload,
	onProgress: (done: number, total: number) => void,
): Promise<ApplyImportResult> {
	const result: ApplyImportResult = { successCount: 0, failedCount: 0, errors: [] };
	const total = payload.ir.entities.length;

	/*
	 * 环境预检：同 pcb-writer，缺 API 直接抛错，给出明确原因。
	 */
	const eda = edaApi();
	if (!eda)
		throw new Error('EDA API 不可用（eda 未注入到当前执行环境）');
	const missing = findMissingSchApis(eda, payload.ir.entities);
	if (missing.length > 0)
		throw new Error(`EDA API 不可用，缺少：${missing.join('、')}`);

	const ctx: SchCtx = {
		units: payload.options.units === 'auto' ? payload.ir.units : payload.options.units,
		enabled: payload.options.enabledKinds,
		mapping: payload.mapping,
		emptyLayers: new Set(payload.ir.layers.filter(l => l.entityCount === 0).map(l => l.name)),
		skipEmpty: payload.options.skipEmptyLayers,
		lineWidth: payload.options.defaultLineWidthMil / MIL_PER_100TH_INCH,
		// 原点偏移以 mil 统一存放，SCH 数据层是 0.01 inch（=10mil），写入时换算。
		offsetSch: {
			x: (payload.options.originOffsetMil?.x ?? 0) / MIL_PER_100TH_INCH,
			y: (payload.options.originOffsetMil?.y ?? 0) / MIL_PER_100TH_INCH,
		},
	};

	for (let i = 0; i < total; i++) {
		await writeSchOne(eda, payload.ir.entities[i]!, ctx, result);
		if (i % 10 === 0)
			onProgress(i, total);
	}
	onProgress(total, total);
	return result;
}

/** 找出本批实体需要但 eda 上不存在的 API（原理图侧）。 */
function findMissingSchApis(eda: EdaGlobals, entities: ReadonlyArray<DwgEntity>): string[] {
	const kinds = new Set<DwgEntityKind>(entities.map(e => e.kind));
	const missing: string[] = [];
	if (kinds.has('LINE') && !eda.sch_PrimitiveWire?.create)
		missing.push('sch_PrimitiveWire.create');
	if (kinds.has('CIRCLE') && !eda.sch_PrimitiveCircle?.create)
		missing.push('sch_PrimitiveCircle.create');
	if (kinds.has('ARC') && !eda.sch_PrimitiveArc?.create)
		missing.push('sch_PrimitiveArc.create');
	if (kinds.has('LWPOLYLINE') || kinds.has('POLYLINE') || kinds.has('SPLINE')) {
		if (!eda.sch_PrimitivePolygon?.create)
			missing.push('sch_PrimitivePolygon.create');
	}
	if ((kinds.has('TEXT') || kinds.has('MTEXT')) && !eda.sch_PrimitiveText?.create)
		missing.push('sch_PrimitiveText.create');
	return missing;
}

interface SchCtx {
	units: DwgUnit;
	enabled: ReadonlySet<string>;
	mapping: Record<string, number | null>;
	emptyLayers: Set<string>;
	skipEmpty: boolean;
	lineWidth: number;
	/** 原点偏移（已换算为 SCH 数据层单位 0.01 inch）。 */
	offsetSch: { x: number; y: number };
}

function toSchUnit(valueInDwg: number, units: SchCtx['units']): number {
	return dwgToMil(valueInDwg, units) / MIL_PER_100TH_INCH;
}

async function writeSchOne(
	eda: EdaGlobals,
	e: DwgEntity,
	ctx: SchCtx,
	result: ApplyImportResult,
): Promise<void> {
	const targetLayer = ctx.mapping[e.layer];
	if (targetLayer === undefined || targetLayer === null)
		return;
	if (ctx.skipEmpty && ctx.emptyLayers.has(e.layer))
		return;
	if (!ctx.enabled.has(e.kind))
		return;

	/*
	 * 坐标换算（含原点偏移）与长度换算（不含偏移）必须分开：
	 * 坐标 = 偏移 + DWG 值换算成 SCH 单位；半径、字高等尺寸只做单位换算。
	 */
	const UX = (v: number): number => ctx.offsetSch.x + toSchUnit(v, ctx.units);
	const UY = (v: number): number => ctx.offsetSch.y + toSchUnit(v, ctx.units);
	const LN = (v: number): number => toSchUnit(v, ctx.units);

	try {
		switch (e.kind) {
			case 'LINE': {
				const created = await eda.sch_PrimitiveWire?.create?.(
					[UX(e.start.x), UY(e.start.y), UX(e.end.x), UY(e.end.y)],
					undefined,
					null,
					ctx.lineWidth,
				);
				countCreated(result, e, created);
				break;
			}

			case 'CIRCLE': {
				const created = await eda.sch_PrimitiveCircle?.create?.(
					UX(e.center.x),
					UY(e.center.y),
					LN(e.radius),
					null,
					null,
					ctx.lineWidth,
				);
				countCreated(result, e, created);
				break;
			}

			case 'ARC': {
				// SCH ARC 需要「起点 + 参考点（圆心）+ 终点」。
				const p1 = pointOnCircle(e.center, e.radius, e.startAngle);
				const p2 = pointOnCircle(e.center, e.radius, e.endAngle);
				const created = await eda.sch_PrimitiveArc?.create?.(
					UX(p1.x),
					UY(p1.y),
					UX(e.center.x),
					UY(e.center.y),
					UX(p2.x),
					UY(p2.y),
					null,
					null,
					ctx.lineWidth,
				);
				countCreated(result, e, created);
				break;
			}

			case 'LWPOLYLINE':
			case 'POLYLINE':
			case 'SPLINE': {
				if (e.points.length < 2) {
					result.failedCount += 1;
					pushError(result, e, '折线点数不足');
					break;
				}
				const flat: number[] = [];
				for (const p of e.points) {
					flat.push(UX(p.x), UY(p.y));
				}
				const created = await eda.sch_PrimitivePolygon?.create?.(flat, null, null, ctx.lineWidth);
				countCreated(result, e, created);
				break;
			}

			case 'TEXT':
			case 'MTEXT': {
				const created = await eda.sch_PrimitiveText?.create?.(
					UX(e.position.x),
					UY(e.position.y),
					e.content,
					radToDeg(e.rotation),
					null,
					null,
					Math.max(1, LN(e.height) * 0.8),
				);
				countCreated(result, e, created);
				break;
			}
		}
	}
	catch (err) {
		result.failedCount += 1;
		pushError(result, e, (err as Error)?.message ?? String(err));
	}
}

function pointOnCircle(center: DwgPoint, radius: number, angleRad: number): DwgPoint {
	return {
		x: center.x + Math.cos(angleRad) * radius,
		y: center.y + Math.sin(angleRad) * radius,
	};
}
