/**
 * 选项 section：实体类型开关、默认线宽、单位、跳过空图层。
 */

import type { DwgEntityKind, DwgUnit, ImportOptions } from '../../shared/types';
import { t } from '../../shared/i18n';
import { ALL_ENTITY_KINDS } from '../../shared/types';

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
	const kindBox = root.querySelector<HTMLDivElement>('[data-role="kind-grid"]')!;
	const widthSelect = root.querySelector<HTMLSelectElement>('[data-role="width-select"]')!;
	const unitSelect = root.querySelector<HTMLSelectElement>('[data-role="unit-select"]')!;
	const skipEmpty = root.querySelector<HTMLInputElement>('[data-role="skip-empty"]')!;

	root.querySelector('[data-role="title"]')!.textContent = t('Options');
	root.querySelector('[data-role="kind-label"]')!.textContent = t('Entity types');
	root.querySelector('[data-role="width-label"]')!.textContent = t('Default line width');
	root.querySelector('[data-role="unit-label"]')!.textContent = t('Units');
	root.querySelector('[data-role="skip-empty-label"]')!.textContent = t('Skip empty layers');
	root.querySelector('[data-role="merge-collinear-label"]')!.textContent = t('Merge collinear segments (coming soon)');

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
