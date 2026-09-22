/**
 * 图层映射 section：左侧 DWG 图层列表 + 右侧 PCB 层下拉。
 *
 * 智能建议（颜色 / 名字匹配）由 src/iframe/dwg/layer-suggest.ts 提供。
 */

import type { DwgLayer, LayerMapping, PcbLayerInfo } from '../../shared/types';
import { LAYER } from '../../shared/eda-api';
import { t } from '../../shared/i18n';
import { need } from './dom';
import { suggestAllByColor, suggestAllByName } from './layer-suggest-bridge';

export interface LayerMappingSection {
	setLayers: (layers: ReadonlyArray<DwgLayer>, pcbLayers: ReadonlyArray<PcbLayerInfo>) => void;
	getMapping: () => LayerMapping;
	setMapping: (m: LayerMapping) => void;
	reset: () => void;
}

interface Row {
	layerName: string;
	enabled: boolean;
	targetLayerId: number | null;
	color: number;
}

const NONE_VALUE = '__none__';

/**
 * PCB 层名规范化：EDA 返回的层名可能是中文也可能是英文（取决于客户端语言），
 * 而扩展自己的界面语言是独立的——所以先归一到英文规范名，再交给 t() 翻译，
 * 两边都能显示成当前界面语言。
 */
const LAYER_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
	[/^(?:top layer|顶层)$/i, 'Top Layer'],
	[/^(?:bottom layer|底层)$/i, 'Bottom Layer'],
	[/^(?:top silkscreen|顶层丝印)$/i, 'Top Silkscreen'],
	[/^(?:bottom silkscreen|底层丝印)$/i, 'Bottom Silkscreen'],
	[/^(?:top solder ?mask|顶层阻焊)$/i, 'Top Solder Mask'],
	[/^(?:bottom solder ?mask|底层阻焊)$/i, 'Bottom Solder Mask'],
	[/^(?:top paste ?mask|顶层锡膏)$/i, 'Top Paste Mask'],
	[/^(?:bottom paste ?mask|底层锡膏)$/i, 'Bottom Paste Mask'],
	[/^(?:board outline|board ?edge|板框|边框)$/i, 'Board Outline'],
	[/^(?:multi-?layer|多层)$/i, 'Multi-Layer'],
	[/^(?:mechanical(?: layer)?|机械层?)$/i, 'Mechanical Layer'],
	[/^(?:document(?: layer)?|文档层?)$/i, 'Document Layer'],
	[/^(?:inner ?(\d+)|内层 ?(\d+))$/i, 'Inner Layer'],
];

/** 归一化层名 → 当前界面语言下的显示名；没有对应文案时原样返回。 */
function layerLabel(name: string): string {
	let canonical = name;
	for (const [pattern, key] of LAYER_ALIASES) {
		const m = pattern.exec(name);
		if (!m)
			continue;
		const num = m[1] ?? m[2];
		canonical = num ? `${key} ${num}` : key;
		break;
	}
	// 内层按 `Inner Layer N` 归一后，用带序号的文案模板
	if (canonical.startsWith('Inner Layer ')) {
		const idx = canonical.slice('Inner Layer '.length);
		const tpl = t('Inner Layer {0}');
		return tpl === 'Inner Layer {0}' ? canonical : tpl.replace('{0}', idx);
	}
	const translated = t(canonical);
	return translated && translated !== canonical ? translated : name;
}

export function createLayerMapping(root: HTMLElement): LayerMappingSection {
	const tbody = need<HTMLTableSectionElement>(root, 'rows');
	const toolbar = need(root, 'toolbar');

	need(toolbar, 'select-all').textContent = t('Select all');
	need(toolbar, 'deselect-all').textContent = t('Deselect all');
	need(toolbar, 'by-color').textContent = t('Match by color');
	need(toolbar, 'by-name').textContent = t('Match by name');
	need(toolbar, 'reset').textContent = t('Reset');
	need(root, 'col-dwg').textContent = 'DWG';
	need(root, 'col-pcb').textContent = t('PCB layer');

	let rows: Row[] = [];
	let pcbLayers: PcbLayerInfo[] = [];
	const pcbNone: PcbLayerInfo = { id: -1, name: t('Do not import') };

	/*
	 * 表头批量设置：原先只能逐行选层，图层多时很费事。
	 * 下拉放在「PCB 层」表头里，选中后一次把所有 DWG 图层指到该层（并勾选启用）。
	 * 占位项只作提示，选中它不会改动任何行。
	 */
	const bulk = document.createElement('select');
	bulk.className = 'layer-bulk-select';
	bulk.title = t('Set all layers to');
	bulk.addEventListener('change', () => {
		if (bulk.value === NONE_VALUE)
			return;
		const id = Number.parseInt(bulk.value, 10);
		if (!Number.isFinite(id))
			return;
		for (const r of rows) {
			r.enabled = true;
			r.targetLayerId = id;
		}
		render();
	});
	const pcbHeaderCell = need(root, 'col-pcb');
	pcbHeaderCell.parentElement?.classList.add('layer-bulk-cell');
	pcbHeaderCell.appendChild(bulk);

	function renderBulkOptions(): void {
		bulk.innerHTML = `<option value="${NONE_VALUE}">${escapeHtml(t('Set all layers to...'))}</option>${
			pcbLayers.map(p => `<option value="${p.id}">${escapeHtml(layerLabelOf(p))}</option>`).join('')}`;
		bulk.value = NONE_VALUE;
	}

	function buildOptionsHtml(): string {
		const opts = [`<option value="${NONE_VALUE}">${escapeHtml(pcbNone.name)}</option>`];
		for (const p of pcbLayers) {
			opts.push(`<option value="${p.id}">${escapeHtml(layerLabelOf(p))}</option>`);
		}
		return opts.join('');
	}

	function render(): void {
		tbody.innerHTML = '';
		for (const r of rows) {
			const tr = document.createElement('tr');
			tr.dataset.layerName = r.layerName;

			const colorCell = document.createElement('td');
			const swatch = document.createElement('span');
			swatch.className = 'dwg-color-swatch';
			swatch.style.backgroundColor = aciToCss(r.color);
			colorCell.appendChild(swatch);
			tr.appendChild(colorCell);

			const nameCell = document.createElement('td');
			nameCell.textContent = r.layerName;
			tr.appendChild(nameCell);

			const checkCell = document.createElement('td');
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = r.enabled;
			checkbox.addEventListener('change', () => {
				r.enabled = checkbox.checked;
				if (!r.enabled)
					r.targetLayerId = null;
			});
			checkCell.appendChild(checkbox);
			tr.appendChild(checkCell);

			const selectCell = document.createElement('td');
			const select = document.createElement('select');
			select.innerHTML = buildOptionsHtml();
			select.value = r.targetLayerId === null ? NONE_VALUE : String(r.targetLayerId);
			select.addEventListener('change', () => {
				r.targetLayerId = select.value === NONE_VALUE ? null : Number.parseInt(select.value, 10);
				if (r.targetLayerId !== null)
					r.enabled = true;
			});
			selectCell.appendChild(select);
			tr.appendChild(selectCell);

			tbody.appendChild(tr);
		}
	}

	function setMapping(m: LayerMapping): void {
		for (const r of rows) {
			const v = m[r.layerName];
			r.enabled = v !== undefined && v !== null;
			r.targetLayerId = v ?? null;
		}
		render();
	}

	function getMapping(): LayerMapping {
		const out: LayerMapping = {};
		for (const r of rows) {
			out[r.layerName] = r.enabled ? r.targetLayerId : null;
		}
		return out;
	}

	need(toolbar, 'select-all').addEventListener('click', () => {
		for (const r of rows) r.enabled = true;
		render();
	});
	need(toolbar, 'deselect-all').addEventListener('click', () => {
		for (const r of rows) {
			r.enabled = false;
			r.targetLayerId = null;
		}
		render();
	});
	need(toolbar, 'by-color').addEventListener('click', () => {
		const mapping = suggestAllByColor(
			rows.map(r => ({ name: r.layerName, color: r.color })),
			pcbLayers,
		);
		setMapping(mapping);
	});
	need(toolbar, 'by-name').addEventListener('click', () => {
		const mapping = suggestAllByName(rows.map(r => ({ name: r.layerName })));
		setMapping(mapping);
	});
	need(toolbar, 'reset').addEventListener('click', () => {
		for (const r of rows) {
			r.enabled = false;
			r.targetLayerId = null;
		}
		render();
	});

	return {
		setLayers(layers, pcb) {
			rows = layers.map(l => ({
				layerName: l.name,
				enabled: false,
				targetLayerId: null,
				color: l.color,
			}));
			pcbLayers = pcb.slice();
			renderBulkOptions();
			render();
		},
		getMapping,
		setMapping,
		reset() {
			for (const r of rows) {
				r.enabled = false;
				r.targetLayerId = null;
			}
			render();
		},
	};
}

function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

/** 预览与图层色块共用 ACI 调色板。0/256 的继承关系由调用方先解析。 */
export function aciToCss(aci: number): string {
	const palette: Record<number, string> = {
		1: '#ff0000',
		2: '#ffff00',
		3: '#00ff00',
		4: '#00ffff',
		5: '#0000ff',
		6: '#ff00ff',
		7: '#ffffff',
		8: '#808080',
		9: '#c0c0c0',
	};
	if (palette[aci])
		return palette[aci];
	if (aci >= 250 && aci <= 255) {
		const gray = [51, 80, 105, 130, 190, 255][aci - 250]!;
		return `rgb(${gray}, ${gray}, ${gray})`;
	}
	if (aci < 10 || aci > 249)
		return '#ffffff';
	const hue = Math.floor((aci - 10) / 10) * 15;
	const shade = (aci - 10) % 10;
	const value = [255, 165, 127, 76, 38][Math.floor(shade / 2)]!;
	const saturation = shade % 2 === 0 ? 1 : 0.5;
	const chroma = value * saturation;
	const mid = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
	const rgb = [[chroma, mid, 0], [mid, chroma, 0], [0, chroma, mid], [0, mid, chroma], [mid, 0, chroma], [chroma, 0, mid]][Math.floor(hue / 60)]!;
	return `rgb(${rgb.map(c => Math.floor(c + value - chroma)).join(', ')})`;
}

/**
 * PCB 层显示名：**按层 ID** 取文案，保证与 PCB 默认层名一致、且随界面语言切换。
 *
 * 为什么不按名字翻译：EDA 返回的层名本身随客户端语言变化（中文客户端给「顶层丝印」、
 * 英文客户端给「Top Silkscreen」），靠名字反查既漏又容易误配；层 ID 是稳定的枚举值
 * （EPCB_LayerId，见 eda-api.ts 的 LAYER 常量）。ID 识别不出来时（自定义层等）再退回
 * 名字表（layerLabel），最后原样显示 EDA 给的名字。
 */
function layerLabelOf(p: PcbLayerInfo): string {
	const byId: Record<number, string> = {
		1: 'Top Layer',
		2: 'Bottom Layer',
		3: 'Top Silkscreen',
		4: 'Bottom Silkscreen',
		5: 'Top Solder Mask',
		6: 'Bottom Solder Mask',
		7: 'Top Paste Mask',
		8: 'Bottom Paste Mask',
		9: 'Top Assembly',
		10: 'Bottom Assembly',
		11: 'Board Outline',
		12: 'Multi-Layer',
		13: 'Document Layer',
		14: 'Mechanical Layer',
	};
	const key = byId[p.id];
	if (key) {
		const label = t(key);
		if (label && label !== key)
			return label;
	}
	// 内层 15..44 → 内层 N（N 从 1 起）
	if (p.id >= LAYER.INNER_1 && p.id <= LAYER.INNER_30) {
		const num = String(p.id - LAYER.INNER_1 + 1);
		const tpl = t('Inner Layer {0}');
		if (tpl !== 'Inner Layer {0}')
			return tpl.replace('{0}', num);
	}
	// 自定义层 71..100 → 自定义层 N
	if (p.id >= LAYER.CUSTOM_1 && p.id <= LAYER.CUSTOM_30) {
		const num = String(p.id - LAYER.CUSTOM_1 + 1);
		const tpl = t('Custom Layer {0}');
		if (tpl !== 'Custom Layer {0}')
			return tpl.replace('{0}', num);
	}
	return layerLabel(p.name);
}
