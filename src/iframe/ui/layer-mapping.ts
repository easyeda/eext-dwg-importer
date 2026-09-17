/**
 * 图层映射 section：左侧 DWG 图层列表 + 右侧 PCB 层下拉。
 *
 * 智能建议（颜色 / 名字匹配）由 src/iframe/dwg/layer-suggest.ts 提供。
 */

import type { DwgLayer, LayerMapping, PcbLayerInfo } from '../../shared/types';
import { t } from '../../shared/i18n';
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

export function createLayerMapping(root: HTMLElement): LayerMappingSection {
	const tbody = root.querySelector<HTMLTableSectionElement>('[data-role="rows"]')!;
	const toolbar = root.querySelector<HTMLDivElement>('[data-role="toolbar"]')!;

	toolbar.querySelector('[data-role="select-all"]')!.textContent = t('Select all');
	toolbar.querySelector('[data-role="deselect-all"]')!.textContent = t('Deselect all');
	toolbar.querySelector('[data-role="by-color"]')!.textContent = t('Match by color');
	toolbar.querySelector('[data-role="by-name"]')!.textContent = t('Match by name');
	toolbar.querySelector('[data-role="reset"]')!.textContent = t('Reset');
	root.querySelector('[data-role="col-dwg"]')!.textContent = 'DWG';
	root.querySelector('[data-role="col-pcb"]')!.textContent = t('PCB layer');

	let rows: Row[] = [];
	let pcbLayers: PcbLayerInfo[] = [];
	const pcbNone: PcbLayerInfo = { id: -1, name: t('Do not import') };

	function buildOptionsHtml(): string {
		const opts = [`<option value="${NONE_VALUE}">${escapeHtml(pcbNone.name)}</option>`];
		for (const p of pcbLayers) {
			opts.push(`<option value="${p.id}">${escapeHtml(p.name)}</option>`);
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

	toolbar.querySelector('[data-role="select-all"]')!.addEventListener('click', () => {
		for (const r of rows) r.enabled = true;
		render();
	});
	toolbar.querySelector('[data-role="deselect-all"]')!.addEventListener('click', () => {
		for (const r of rows) {
			r.enabled = false;
			r.targetLayerId = null;
		}
		render();
	});
	toolbar.querySelector('[data-role="by-color"]')!.addEventListener('click', () => {
		const mapping = suggestAllByColor(
			rows.map(r => ({ name: r.layerName, color: r.color })),
			pcbLayers,
		);
		setMapping(mapping);
	});
	toolbar.querySelector('[data-role="by-name"]')!.addEventListener('click', () => {
		const mapping = suggestAllByName(rows.map(r => ({ name: r.layerName })));
		setMapping(mapping);
	});
	toolbar.querySelector('[data-role="reset"]')!.addEventListener('click', () => {
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

/** ACI 颜色 → CSS 颜色。简单近似：1..7 用调色板，其它用灰度。 */
function aciToCss(aci: number): string {
	const palette: Record<number, string> = {
		1: '#ff0000',
		2: '#ffff00',
		3: '#00ff00',
		4: '#00ffff',
		5: '#0000ff',
		6: '#ff00ff',
		7: '#ffffff',
	};
	return palette[aci] ?? `rgb(${Math.min(255, aci * 32)}, ${Math.min(255, aci * 32)}, ${Math.min(255, aci * 32)})`;
}
