/**
 * 选项 section：实体类型开关、默认线宽、单位、跳过空图层。
 */

import type { DwgEntityKind, DwgUnit, ImportOptions } from '../../shared/types';
import { t } from '../../shared/i18n';
import { ALL_ENTITY_KINDS } from '../../shared/types';
import { need } from './dom';

const PRESET_WIDTHS: ReadonlyArray<number> = [1, 2, 4, 6, 8, 10, 20];

const KIND_LABEL_KEY: Record<DwgEntityKind, string> = {
	LINE: 'LINE',
	LWPOLYLINE: 'LWPOLYLINE',
	POLYLINE: 'POLYLINE',
	CIRCLE: 'CIRCLE',
	ARC: 'ARC',
	TEXT: 'TEXT',
	MTEXT: 'MTEXT',
	SPLINE: 'SPLINE',
};

export interface OptionsSection {
	getOptions: () => ImportOptions;
	setOptions: (o: ImportOptions) => void;
}

export function createOptionsSection(root: HTMLElement): OptionsSection {
	const kindBox = need(root, 'kind-grid');
	const widthSelect = need<HTMLSelectElement>(root, 'width-select');
	const unitSelect = need<HTMLSelectElement>(root, 'unit-select');
	const skipEmpty = need<HTMLInputElement>(root, 'skip-empty');

	need(root, 'title').textContent = t('Options');
	need(root, 'kind-label').textContent = t('Entity types');
	need(root, 'width-label').textContent = t('Default line width');
	need(root, 'unit-label').textContent = t('Units');
	need(root, 'skip-empty-label').textContent = t('Skip empty layers');
	need(root, 'merge-collinear-label').textContent = t('Merge collinear segments (coming soon)');

	for (const w of PRESET_WIDTHS) {
		const opt = document.createElement('option');
		opt.value = String(w);
		opt.textContent = `${w} mil`;
		widthSelect.appendChild(opt);
	}
	unitSelect.innerHTML = `
		<option value="auto">${escapeHtml(t('Auto (from DWG)'))}</option>
		<option value="mm">mm</option>
		<option value="inch">inch</option>
	`;

	function rebuildKindGrid(enabled: Set<DwgEntityKind>): void {
		kindBox.innerHTML = '';
		for (const k of ALL_ENTITY_KINDS) {
			const label = document.createElement('label');
			label.className = 'kind-chip';
			const cb = document.createElement('input');
			cb.type = 'checkbox';
			cb.checked = enabled.has(k);
			cb.dataset.kind = k;
			cb.addEventListener('change', () => {
				if (cb.checked)
					enabled.add(k);
				else
					enabled.delete(k);
			});
			const span = document.createElement('span');
			span.textContent = KIND_LABEL_KEY[k];
			label.appendChild(cb);
			label.appendChild(span);
			kindBox.appendChild(label);
		}
	}

	const state: ImportOptions & { enabledKinds: Set<DwgEntityKind> } = {
		enabledKinds: new Set(ALL_ENTITY_KINDS),
		defaultLineWidthMil: 4,
		units: 'auto',
		skipEmptyLayers: true,
	};

	rebuildKindGrid(state.enabledKinds);
	widthSelect.value = String(state.defaultLineWidthMil);
	unitSelect.value = state.units;
	skipEmpty.checked = state.skipEmptyLayers;

	widthSelect.addEventListener('change', () => {
		state.defaultLineWidthMil = Number.parseInt(widthSelect.value, 10);
	});
	unitSelect.addEventListener('change', () => {
		state.units = unitSelect.value as DwgUnit | 'auto';
	});
	skipEmpty.addEventListener('change', () => {
		state.skipEmptyLayers = skipEmpty.checked;
	});

	return {
		getOptions() {
			const enabled = new Set<DwgEntityKind>();
			for (const cb of kindBox.querySelectorAll<HTMLInputElement>('input[data-kind]')) {
				if (cb.checked)
					enabled.add(cb.dataset.kind as DwgEntityKind);
			}
			state.enabledKinds = enabled;
			return { ...state, enabledKinds: enabled };
		},
		setOptions(o: ImportOptions) {
			state.enabledKinds = new Set(o.enabledKinds);
			state.defaultLineWidthMil = o.defaultLineWidthMil;
			state.units = o.units;
			state.skipEmptyLayers = o.skipEmptyLayers;
			widthSelect.value = String(state.defaultLineWidthMil);
			unitSelect.value = state.units;
			skipEmpty.checked = state.skipEmptyLayers;
			rebuildKindGrid(state.enabledKinds);
		},
	};
}

function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}
