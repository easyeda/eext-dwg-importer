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
 *     注意 Arc 用「两端点 + 圆弧角」，不是「圆心 + 半径 + 起止角」；
 *     interactiveMode 显式传 TWO_POINT_ARC(1)，与该参数形状一致。
 * - String.create(layer, x, y, text, fontFamily, fontSize, lineWidth, alignMode,
 *                 rotation, reverse, expansion, mirror, locked)
 * 多边形通过 eda.pcb_MathPolygon.createPolygon([x1, y1, 'L', x2, y2, ...]) 构造
 * （首坐标点在 'L' 之前，官方示例即此格式）。
 *
 * ⚠️ net 按层语义（实测）：Line/Arc/Polyline 的 net 参数在非信号层
 * （丝印/文档/板框/机械层等）必须传 undefined 省略——传 '' 会被按电气图元
 * 校验而报 [INVALID_LAYER]；信号层传 '' 表示无网络。经 NET = isPcbSignalLayer() 决定。
 *
 * ⚠️ 图元按层语义（实测）：导线（Track = pcb_PrimitiveLine）是严格的电气图元，
 * 仅信号层可用（省略 net 也不行）；图形层的直线一律用折线（Polyline）两点表达。
 * 圆弧（ArcTrack）在图形层省略 net 即可用。
 *
 * ⚠️ 失败必须可见：所有 create() 返回 `Promise<IPCB_* | undefined>`，
 * undefined 表示创建失败。本文件统一经 countCreated() 检查返回值，
 * 并在导入开始前做环境预检（缺 API 直接抛错），杜绝「静默 0 导入」。
 */

import type { EdaGlobals, PcbPolygonSource } from '../shared/eda-api';
import type {
	ApplyImportPayload,
	ApplyImportResult,
	DwgEntity,
	DwgEntityKind,
	DwgUnit,
	LayerMapping,
} from '../shared/types';
import { arcSegmentsForSweep } from '../shared/curve';
import { edaApi, isPcbSignalLayer } from '../shared/eda-api';
import { dwgToMil, radToDeg } from '../shared/units';
import { countCreated, pushError } from './apply-result';

const BATCH = 50;
/**
 * EPCB_PrimitiveStringAlignMode：文本对齐模式（枚举从 1 开始，没有 0）。
 * 取值：LEFT_TOP=1, LEFT_MIDDLE=2, LEFT_BOTTOM=3, CENTER_TOP=4, CENTER=5,
 *       CENTER_BOTTOM=6, RIGHT_TOP=7, RIGHT_MIDDLE=8, RIGHT_BOTTOM=9。
 * 这里用 LEFT_BOTTOM(3)，与 DWG 文本基点在左下一致。
 */
const STRING_ALIGN_LEFT_BOTTOM = 3;
/** EPCB_PrimitiveArcInteractiveMode.TWO_POINT_ARC：两端点 + 圆弧角模式。 */
const ARC_MODE_TWO_POINT = 1;
/** 图形层圆弧采成折线时的矢高 / 弦长 相对误差上限（与多段线凸度采样同一口径）。 */
const ARC_TOL_RATIO = 0.02;
/** 单个圆弧的最大采样段数（半圆约需 20 段，64 段足够覆盖整圆）。 */
const MAX_ARC_SEGMENTS = 64;
/** 官方示例使用的默认字体名。 */
const DEFAULT_FONT = 'default';

export async function applyPcbImport(
	payload: ApplyImportPayload,
	onProgress: (done: number, total: number) => void,
): Promise<ApplyImportResult> {
	const result: ApplyImportResult = { successCount: 0, failedCount: 0, errors: [] };
	const total = payload.ir.entities.length;

	/*
	 * 环境预检：一次性确认本批实体需要的 API 都存在。
	 * 缺失时直接抛错（runImport 会展示原因并保持弹窗打开），
	 * 而不是逐实体静默跳过后汇报「导入完成 0 个」。
	 */
	const eda = edaApi();
	if (!eda)
		throw new Error('EDA API 不可用（eda 未注入到当前执行环境）');
	const missing = findMissingPcbApis(eda, payload.ir.entities);
	if (missing.length > 0)
		throw new Error(`EDA API 不可用，缺少：${missing.join('、')}`);

	const emptyLayers = new Set(payload.ir.layers.filter(l => l.entityCount === 0).map(l => l.name));

	const context: WriteContext = {
		units: payload.options.units === 'auto' ? payload.ir.units : payload.options.units,
		enabled: payload.options.enabledKinds,
		width: payload.options.defaultLineWidthMil,
		mapping: payload.mapping,
		skipEmptyLayers: payload.options.skipEmptyLayers,
		emptyLayers,
		// 原点偏移（mil）：DWG (0,0) 落到画布的该坐标；旧数据缺省时视为 0。
		offset: payload.options.originOffsetMil ?? { x: 0, y: 0 },
	};

	for (let i = 0; i < total; i += BATCH) {
		const slice = payload.ir.entities.slice(i, i + BATCH);
		await Promise.all(slice.map(e => writeOne(eda, e, context, result)));
		onProgress(Math.min(i + BATCH, total), total);
	}
	return result;
}

/**
 * 找出本批实体需要但 eda 上不存在的 API。
 * 只检查实体实际用到的命名空间，避免对「纯线条导入」误报文本 API 缺失。
 */
function findMissingPcbApis(eda: EdaGlobals, entities: ReadonlyArray<DwgEntity>): string[] {
	const kinds = new Set<DwgEntityKind>(entities.map(e => e.kind));
	const missing: string[] = [];
	if (kinds.has('LINE') && !eda.pcb_PrimitiveLine?.create)
		missing.push('pcb_PrimitiveLine.create');
	if (kinds.has('ARC') && !eda.pcb_PrimitiveArc?.create)
		missing.push('pcb_PrimitiveArc.create');
	if (kinds.has('CIRCLE') || kinds.has('LWPOLYLINE') || kinds.has('POLYLINE') || kinds.has('SPLINE')) {
		if (!eda.pcb_MathPolygon?.createPolygon)
			missing.push('pcb_MathPolygon.createPolygon');
		if (!eda.pcb_PrimitivePolyline?.create)
			missing.push('pcb_PrimitivePolyline.create');
	}
	if ((kinds.has('TEXT') || kinds.has('MTEXT')) && !eda.pcb_PrimitiveString?.create)
		missing.push('pcb_PrimitiveString.create');
	return missing;
}

interface WriteContext {
	units: DwgUnit;
	enabled: ReadonlySet<string>;
	width: number;
	mapping: LayerMapping;
	skipEmptyLayers: boolean;
	emptyLayers: Set<string>;
	/** 原点偏移（mil），加在坐标换算结果上；长度/尺寸类不偏移。 */
	offset: { x: number; y: number };
}

async function writeOne(
	eda: EdaGlobals,
	e: DwgEntity,
	ctx: WriteContext,
	result: ApplyImportResult,
): Promise<void> {
	const targetLayer = ctx.mapping[e.layer];
	if (targetLayer === undefined || targetLayer === null)
		return;
	if (ctx.skipEmptyLayers && ctx.emptyLayers.has(e.layer))
		return;
	if (!ctx.enabled.has(e.kind))
		return;

	/*
	 * 坐标换算（含原点偏移）与长度换算（不含偏移）必须分开：
	 * 坐标 = 偏移 + DWG 值换算成 mil；半径、字高等尺寸只做单位换算。
	 */
	const CX = (v: number): number => ctx.offset.x + dwgToMil(v, ctx.units);
	const CY = (v: number): number => ctx.offset.y + dwgToMil(v, ctx.units);
	const LN = (v: number): number => dwgToMil(v, ctx.units);
	/*
	 * net 按层选择（实测依据，v1.1.1）：信号层传 ''（无网络）；
	 * 丝印/文档等图形层必须**省略 net**（undefined）——传空串会被按
	 * 电气图元校验而报 [INVALID_LAYER]（丝印层是用户映射的常见目标，
	 * 此前固定传 '' 导致丝印导入全线失败）。
	 */
	const NET = isPcbSignalLayer(targetLayer) ? '' : undefined;
	/**
	 * 构造单多边形源数组。
	 *
	 * 格式（对照 TPCB_PolygonSourceArray 核实）：`x1 y1 L x2 y2 x3 y3 ...`
	 * 注意**首个坐标点在 'L' 之前**，不是 marker 打头。
	 * 单多边形要求首尾重合，未闭合时会被自动闭合，故这里显式补回首点。
	 */
	const mkPolygon = (points: Array<{ x: number; y: number }>, closed: boolean): PcbPolygonSource | undefined => {
		if (points.length < 2)
			return undefined;
		const first = points[0]!;
		const last = points[points.length - 1]!;
		const needClose = closed && (first.x !== last.x || first.y !== last.y);
		const seq = needClose ? [...points, first] : points;
		const src: PcbPolygonSource = [CX(seq[0]!.x), CY(seq[0]!.y), 'L'];
		for (let i = 1; i < seq.length; i++) {
			src.push(CX(seq[i]!.x), CY(seq[i]!.y));
		}
		return src;
	};

	try {
		switch (e.kind) {
			case 'LINE': {
				/*
				 * 零长度线段直接跳过：DWG 里偶见首尾重合的垃圾线段，
				 * 创建出的零尺寸图元无法选中也无法删除（实机表现为幽灵对象），
				 * 且在任何查看器里都不可见，跳过不损失图形。
				 */
				if (e.start.x === e.end.x && e.start.y === e.end.y) {
					eda.sys_Log?.info?.('[DwgImporter] 跳过零长度线段', e.layer);
					break;
				}
				/*
				 * 导线（Track，即 pcb_PrimitiveLine）是**严格的电气图元**：
				 * 实测（v1.1.1）即使省略 net，非信号层也一律报 [INVALID_LAYER]
				 * （与 ArcTrack 不同——后者省略 net 即可在图形层画弧）。
				 * 因此图形层（丝印/文档/板框等）的直线改用折线（Polyline）表达：
				 * 两点开放折线即直线，官方示例即开放路径（L 形三顶点）。
				 */
				if (isPcbSignalLayer(targetLayer)) {
					const created = await eda.pcb_PrimitiveLine?.create?.(
						NET,
						targetLayer,
						CX(e.start.x),
						CY(e.start.y),
						CX(e.end.x),
						CY(e.end.y),
						ctx.width,
						false,
					);
					countCreated(result, e, created);
					break;
				}
				const lineSrc: PcbPolygonSource = [CX(e.start.x), CY(e.start.y), 'L', CX(e.end.x), CY(e.end.y)];
				const linePolygon = eda.pcb_MathPolygon?.createPolygon?.(lineSrc);
				if (!linePolygon) {
					result.failedCount += 1;
					pushError(result, e, '折线源数据被 EDA 判为不合法（createPolygon 返回 undefined）');
					break;
				}
				const lineCreated = await eda.pcb_PrimitivePolyline?.create?.(NET, targetLayer, linePolygon, ctx.width, false);
				countCreated(result, e, lineCreated);
				break;
			}

			case 'ARC': {
				// EDA 的 ARC 需要两端点 + 圆弧角，故先由圆心/半径/起止角算出两端点。
				const sweepRad = normalizeSweepRad(e.endAngle - e.startAngle);
				/*
				 * 起止角相同的弧在任何查看器里都不可见，却会创建零尺寸幽灵图元
				 * （与零长度线段/零半径圆同类问题），直接跳过。
				 */
				if (!(Math.abs(sweepRad) > 1e-9)) {
					eda.sys_Log?.info?.('[DwgImporter] 跳过零扫掠圆弧', e.layer);
					break;
				}
				/*
				 * 图形层的圆弧改用**折线**表达（与圆同理，圆本来就采成折线）。
				 *
				 * 实测（用户反馈）：pcb_PrimitiveArc（ArcTrack）省略 net 后能在图形层
				 * 创建、也能正常显示，但导入后**无法被选中/拾取**；而同层的折线
				 * （直线与圆都已改折线）选择正常。为保持一致且可拾取，图形层的弧按
				 * 矢高容差采样成开放折线。信号层仍用原生 ArcTrack（电气图元）。
				 */
				if (!isPcbSignalLayer(targetLayer)) {
					const segments = arcSegmentsForSweep(sweepRad, ARC_TOL_RATIO, MAX_ARC_SEGMENTS, 2);
					const arcPoly = mkPolygon(arcPoints(e.center, e.radius, e.startAngle, sweepRad, segments), false);
					if (!arcPoly) {
						result.failedCount += 1;
						pushError(result, e, '圆弧采样点数不足，无法构造折线');
						break;
					}
					const polygon = eda.pcb_MathPolygon?.createPolygon?.(arcPoly);
					if (!polygon) {
						result.failedCount += 1;
						pushError(result, e, '圆弧折线源数据被 EDA 判为不合法（createPolygon 返回 undefined）');
						break;
					}
					const created = await eda.pcb_PrimitivePolyline?.create?.(NET, targetLayer, polygon, ctx.width, false);
					countCreated(result, e, created);
					break;
				}
				const p1 = pointOnCircle(e.center, e.radius, e.startAngle);
				const p2 = pointOnCircle(e.center, e.radius, e.startAngle + sweepRad);
				const created = await eda.pcb_PrimitiveArc?.create?.(
					NET,
					targetLayer,
					CX(p1.x),
					CY(p1.y),
					CX(p2.x),
					CY(p2.y),
					radToDeg(sweepRad),
					ctx.width,
					ARC_MODE_TWO_POINT,
					false,
				);
				countCreated(result, e, created);
				break;
			}

			case 'CIRCLE':
			case 'LWPOLYLINE':
			case 'POLYLINE':
			case 'SPLINE': {
				const isCircle = e.kind === 'CIRCLE';
				// 零半径圆与零长度线段同理：会产生零尺寸幽灵图元，直接跳过。
				if (isCircle && !(e.radius > 0)) {
					eda.sys_Log?.info?.('[DwgImporter] 跳过零半径圆', e.layer);
					break;
				}
				const pts = isCircle
					? circlePoints(e.center, e.radius, 64)
					: e.points;
				// 圆与闭合多段线都要补回首点，保证多边形首尾重合。
				const src = mkPolygon(pts, isCircle || e.closed);
				if (!src) {
					result.failedCount += 1;
					pushError(result, e, '折线点数不足，无法构造多边形');
					break;
				}
				const polygon = eda.pcb_MathPolygon?.createPolygon?.(src);
				if (!polygon) {
					result.failedCount += 1;
					pushError(result, e, '多边形源数据被 EDA 判为不合法（createPolygon 返回 undefined）');
					break;
				}
				const created = await eda.pcb_PrimitivePolyline?.create?.(NET, targetLayer, polygon, ctx.width, false);
				countCreated(result, e, created);
				break;
			}

			case 'TEXT':
			case 'MTEXT': {
				const created = await eda.pcb_PrimitiveString?.create?.(
					targetLayer,
					CX(e.position.x),
					CY(e.position.y),
					e.content,
					DEFAULT_FONT,
					// EDA 的 font 尺寸语义与 DWG 文本高度不同，取 0.8 系数做视觉对齐。
					Math.max(1, LN(e.height) * 0.8),
					ctx.width,
					STRING_ALIGN_LEFT_BOTTOM,
					radToDeg(e.rotation),
					false,
					0,
					false,
					false,
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

function pointOnCircle(center: { x: number; y: number }, radius: number, angleRad: number): { x: number; y: number } {
	return {
		x: center.x + Math.cos(angleRad) * radius,
		y: center.y + Math.sin(angleRad) * radius,
	};
}

/** 圆弧扫掠角归一化到 (-2π, 2π)，负值表示顺时针。 */
function normalizeSweepRad(sweepRad: number): number {
	if (!Number.isFinite(sweepRad))
		return 0;
	let s = sweepRad;
	while (s > Math.PI * 2)
		s -= Math.PI * 2;
	while (s < -Math.PI * 2)
		s += Math.PI * 2;
	return s;
}

/** 采样圆弧为折线点列（含两个端点）。 */
function arcPoints(
	center: { x: number; y: number },
	radius: number,
	startAngle: number,
	sweepRad: number,
	segments: number,
): Array<{ x: number; y: number }> {
	const pts: Array<{ x: number; y: number }> = [];
	for (let i = 0; i <= segments; i++)
		pts.push(pointOnCircle(center, radius, startAngle + (sweepRad * i) / segments));
	return pts;
}

function circlePoints(center: { x: number; y: number }, radius: number, segments: number): Array<{ x: number; y: number }> {
	const pts: Array<{ x: number; y: number }> = [];
	for (let i = 0; i < segments; i++) {
		pts.push(pointOnCircle(center, radius, (i / segments) * Math.PI * 2));
	}
	// 不在此处补首点：闭合由 mkPolygon 统一处理，避免重复。
	return pts;
}
