/**
 * 选项 section：实体类型开关、默认线宽、单位、原点偏移、跳过空图层。
 */

import type { DwgEntityKind, DwgUnit, ImportOptions, OriginOffset } from '../../shared/types';
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

/** 画布拾取回调：返回拾取到的坐标（mil）；取消/失败返回 null。 */
export type PickOriginHandler = () => Promise<OriginOffset | null>;

export interface OptionsSection {
	getOptions: () => ImportOptions;
	setOptions: (o: ImportOptions) => void;
	/** 注册「画布拾取原点」处理器（index.ts 提供，涉及 hideIFrame 等全局编排）。 */
	onPickOrigin: (handler: PickOriginHandler) => void;
	/** 用拾取结果回填偏移输入框（mil）。 */
	setOriginOffset: (o: OriginOffset) => void;
}

export function createOptionsSection(root: HTMLElement): OptionsSection {
	const kindBox = need(root, 'kind-grid');
	const widthSelect = need<HTMLSelectElement>(root, 'width-select');
	const unitSelect = need<HTMLSelectElement>(root, 'unit-select');
	const skipEmpty = need<HTMLInputElement>(root, 'skip-empty');
	const offsetX = need<HTMLInputElement>(root, 'offset-x');
	const offsetY = need<HTMLInputElement>(root, 'offset-y');
	const pickBtn = need<HTMLButtonElement>(root, 'pick-origin');

	need(root, 'title').textContent = t('Options');
	need(root, 'kind-label').textContent = t('Entity types');
	need(root, 'width-label').textContent = t('Default line width');
	need(root, 'unit-label').textContent = t('Units');
	need(root, 'skip-empty-label').textContent = t('Skip empty layers');
	need(root, 'merge-collinear-label').textContent = t('Merge collinear segments (coming soon)');

	const offsetLabel = need(root, 'offset-label');
	offsetLabel.textContent = t('Origin offset (mil)');
	// 悬停说明：语义 + 拾取按钮用法。
	offsetLabel.title = t('Origin offset: the DWG (0,0) is placed at this canvas position. 0,0 keeps both origins coincident.');
	pickBtn.title = t('Pick the origin position on the canvas');
	// 鼠标箭头图标（内联 SVG，随主题色 currentColor）。
	pickBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '
		+ 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
		+ '<path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg>';

	for (const w of PRESET_WIDTHS) {
		const opt = document.createElement('option');
		opt.value = String(w);
		opt.textContent = `${w} mil`;
		widthSelect.appendChild(opt);
	}
	unitSelect.innerHTML = `
		<option value="auto">${escapeHtml(t('Auto (from DWG)'))}</option>
		<option value="mm">mm</option>
		<option value="cm">cm</option>
		<option value="m">m</option>
		<option value="inch">inch</option>
		<option value="mil">mil (1:1)</option>
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
		originOffsetMil: { x: 0, y: 0 },
	};

	rebuildKindGrid(state.enabledKinds);
	widthSelect.value = String(state.defaultLineWidthMil);
	unitSelect.value = state.units;
	skipEmpty.checked = state.skipEmptyLayers;

	function readOffsetInputs(): OriginOffset {
		const x = Number.parseFloat(offsetX.value);
		const y = Number.parseFloat(offsetY.value);
		return {
			x: Number.isFinite(x) ? x : 0,
			y: Number.isFinite(y) ? y : 0,
		};
	}

	function writeOffsetInputs(o: OriginOffset): void {
		offsetX.value = String(o.x);
		offsetY.value = String(o.y);
	}

	writeOffsetInputs(state.originOffsetMil);
	offsetX.addEventListener('change', () => {
		state.originOffsetMil = readOffsetInputs();
	});
	offsetY.addEventListener('change', () => {
		state.originOffsetMil = readOffsetInputs();
	});

	widthSelect.addEventListener('change', () => {
		state.defaultLineWidthMil = Number.parseInt(widthSelect.value, 10);
	});
	unitSelect.addEventListener('change', () => {
		state.units = unitSelect.value as DwgUnit | 'auto';
	});
	skipEmpty.addEventListener('change', () => {
		state.skipEmptyLayers = skipEmpty.checked;
	});

	let pickHandler: PickOriginHandler | null = null;
	pickBtn.addEventListener('click', () => {
		if (!pickHandler || pickBtn.disabled)
			return;
		pickBtn.disabled = true;
		void (async () => {
			try {
				await pickHandler();
			}
			finally {
				pickBtn.disabled = false;
			}
		})();
	});

	return {
		getOptions() {
			const enabled = new Set<DwgEntityKind>();
			for (const cb of kindBox.querySelectorAll<HTMLInputElement>('input[data-kind]')) {
				if (cb.checked)
					enabled.add(cb.dataset.kind as DwgEntityKind);
			}
			state.enabledKinds = enabled;
			// 偏移以输入框当前值为准（change 未触发时也能取到最新输入）。
			state.originOffsetMil = readOffsetInputs();
			return { ...state, enabledKinds: enabled, originOffsetMil: { ...state.originOffsetMil } };
		},
		setOptions(o: ImportOptions) {
			state.enabledKinds = new Set(o.enabledKinds);
			state.defaultLineWidthMil = o.defaultLineWidthMil;
			state.units = o.units;
			state.skipEmptyLayers = o.skipEmptyLayers;
			state.originOffsetMil = o.originOffsetMil ? { ...o.originOffsetMil } : { x: 0, y: 0 };
			widthSelect.value = String(state.defaultLineWidthMil);
			unitSelect.value = state.units;
			skipEmpty.checked = state.skipEmptyLayers;
			writeOffsetInputs(state.originOffsetMil);
			rebuildKindGrid(state.enabledKinds);
		},
		onPickOrigin(handler: PickOriginHandler) {
			pickHandler = handler;
		},
		setOriginOffset(o: OriginOffset) {
			state.originOffsetMil = { ...o };
			writeOffsetInputs(state.originOffsetMil);
		},
	};
}

function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}
