/**
 * 图层智能建议：基于颜色匹配 + 名字归一化。
 *
 * 约定（DWG 机械图常用命名）：
 * - BOARD_OUTLINE / OUTLINE / WIREFRAME   → BoardOutline
 * - DIM* / DIMENSION                      → Mechanical5
 * - SILK* / PLACE*                        → TopSilkLayer
 * - DOC* / NOTE* / TEXT                   → Document
 */

import type { PcbLayerInfo, Rgb } from '../../shared/types';

/** EDA EPCB_LayerId 枚举的常用字面量（与 pro-api-types 对齐）。 */
export const PCB_LAYER_ID = {
	BoardOutline: 2,
	TopLayer: 1,
	BottomLayer: 30,
	TopSilkLayer: 4,
	BottomSilkLayer: 7,
	Document: 12,
	Mechanical1: 36,
	Mechanical2: 37,
	Mechanical3: 38,
	Mechanical4: 39,
	Mechanical5: 40,
	Mechanical6: 41,
	Mechanical7: 42,
	Mechanical8: 43,
	Mechanical9: 44,
	Mechanical10: 45,
	Mechanical11: 46,
	Mechanical12: 47,
	Mechanical13: 48,
	Mechanical14: 49,
	Mechanical15: 50,
} as const;

const NAME_RULES: Array<{ pattern: RegExp; layerId: number }> = [
	{ pattern: /^(board[_-]?outline|outline|wireframe)$/i, layerId: PCB_LAYER_ID.BoardOutline },
	{ pattern: /^(dim|dimension|dim[_-]?line)$/i, layerId: PCB_LAYER_ID.Mechanical5 },
	{ pattern: /^(top[_-]?silk|silk[_-]?top|place[_-]?top)$/i, layerId: PCB_LAYER_ID.TopSilkLayer },
	{ pattern: /^(bot(tom)?[_-]?silk|silk[_-]?bot(tom)?|place[_-]?bot(tom)?)$/i, layerId: PCB_LAYER_ID.BottomSilkLayer },
	{ pattern: /^(doc|note|text|annotation|comment)$/i, layerId: PCB_LAYER_ID.Document },
];

/** ACI 颜色 → 0..255 RGB。ACI 0/256 = byblock，1..255 是索引。 */
const ACI_PALETTE: Rgb[] = (() => {
	// 简化的 AutoCAD Color Index 调色板（前 16 色即可覆盖 80% 场景）。
	// 完整调色板可在 pro-api-types 中查阅；这里只覆盖识别度高的颜色。
	const palette: Rgb[] = Array.from({ length: 256 }).fill(null).map(() => ({ r: 128, g: 128, b: 128 }));
	const seed: Array<[number, number, number, number]> = [
		[1, 255, 0, 0],
		[2, 255, 255, 0],
		[3, 0, 255, 0],
		[4, 0, 255, 255],
		[5, 0, 0, 255],
		[6, 255, 0, 255],
		[7, 255, 255, 255],
		[8, 128, 128, 128],
		[9, 192, 192, 192],
		[10, 255, 0, 0],
		[30, 255, 102, 0],
		[40, 255, 204, 0],
		[50, 0, 255, 0],
		[60, 0, 204, 153],
		[70, 0, 102, 255],
		[80, 102, 51, 153],
	];
	for (const [i, r, g, b] of seed) palette[i] = { r, g, b };
	return palette;
})();

function aciToRgb(aci: number): Rgb {
	if (aci < 0 || aci >= ACI_PALETTE.length)
		return { r: 128, g: 128, b: 128 };
	return ACI_PALETTE[aci]!;
}

function colorDistance(a: Rgb, b: Rgb): number {
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

const COLOR_MATCH_THRESHOLD = 32;

/** 名字归一化匹配（优先）。 */
function matchByName(layerName: string): number | null {
	for (const rule of NAME_RULES) {
		if (rule.pattern.test(layerName))
			return rule.layerId;
	}
	return null;
}

/** 颜色匹配（EDA 各层默认颜色相似度 ≥ 90% 视为匹配）。 */
function matchByColor(aciColor: number, pcbLayers: ReadonlyArray<PcbLayerInfo>): number | null {
	const target = aciToRgb(aciColor);
	let bestId: number | null = null;
	let bestDist = COLOR_MATCH_THRESHOLD;
	for (const pcb of pcbLayers) {
		if (!pcb.color)
			continue;
		const d = colorDistance(target, pcb.color);
		if (d < bestDist) {
			bestDist = d;
			bestId = pcb.id;
		}
	}
	return bestId;
}

/**
 * 综合建议：先名字，后颜色。任一命中即返回。
 */
export function suggestPcbLayer(
	dwgLayerName: string,
	dwgLayerColor: number,
	pcbLayers: ReadonlyArray<PcbLayerInfo>,
): number | null {
	const byName = matchByName(dwgLayerName);
	if (byName !== null)
		return byName;
	const byColor = matchByColor(dwgLayerColor, pcbLayers);
	if (byColor !== null)
		return byColor;
	return null;
}

/** 一键按颜色匹配：返回整张映射。 */
export function suggestAllByColor(
	layers: ReadonlyArray<{ name: string; color: number }>,
	pcbLayers: ReadonlyArray<PcbLayerInfo>,
): Record<string, number | null> {
	const out: Record<string, number | null> = {};
	for (const l of layers) {
		out[l.name] = matchByColor(l.color, pcbLayers);
	}
	return out;
}

/** 一键按名字匹配。 */
export function suggestAllByName(
	layers: ReadonlyArray<{ name: string }>,
): Record<string, number | null> {
	const out: Record<string, number | null> = {};
	for (const l of layers) {
		out[l.name] = matchByName(l.name);
	}
	return out;
}
