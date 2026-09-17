/**
 * 预览 section：包围盒 + 实体计数 + BLOCK 摘要 + warnings。
 */

import type { DwgIR } from '../../shared/types';
import { t } from '../../shared/i18n';
import { need } from './dom';

export interface PreviewSection {
	setIr: (ir: DwgIR) => void;
	reset: () => void;
}

const KIND_LABEL: Record<string, string> = {
	LINE: 'line',
	LWPOLYLINE: 'polyline',
	POLYLINE: 'polyline',
	CIRCLE: 'circle',
	ARC: 'arc',
	TEXT: 'text',
	MTEXT: 'mtext',
	SPLINE: 'spline',
};

export function createPreviewSection(root: HTMLElement): PreviewSection {
	const bbEl = need(root, 'bbox');
	const countsEl = need(root, 'counts');
	const blocksEl = need(root, 'blocks');
	const warnEl = need(root, 'warnings');

	need(root, 'title').textContent = t('Preview');
	need(root, 'bbox-label').textContent = t('Bounding box');
	need(root, 'counts-label').textContent = t('Entity counts');
	need(root, 'blocks-label').textContent = t('Blocks (expanded)');
	need(root, 'warnings-label').textContent = t('Warnings');

	function formatMm(value: number): string {
		if (!Number.isFinite(value))
			return '0';
		return value.toFixed(2);
	}

	function render(ir: DwgIR | null): void {
		if (!ir) {
			bbEl.textContent = '—';
			countsEl.textContent = '—';
			blocksEl.innerHTML = '';
			warnEl.innerHTML = '';
			return;
		}
		bbEl.textContent = t(
			'BB X {0} – {1}, Y {2} – {3}',
			formatMm(ir.bbox.minX),
			formatMm(ir.bbox.maxX),
			formatMm(ir.bbox.minY),
			formatMm(ir.bbox.maxY),
		);

		const counts = new Map<string, number>();
		for (const e of ir.entities) {
			const k = KIND_LABEL[e.kind] ?? e.kind;
			counts.set(k, (counts.get(k) ?? 0) + 1);
		}
		countsEl.innerHTML = Array.from(counts.entries())
			.map(([k, v]) => `<span class="count-chip">${escapeHtml(k)}: ${v}</span>`)
			.join('');

		blocksEl.innerHTML = ir.blocks.length === 0
			? '<span class="muted">—</span>'
			: ir.blocks.map(b => `<span class="block-chip">${escapeHtml(b.name)}: ${b.entityCount}</span>`).join('');

		warnEl.innerHTML = ir.parseWarnings.length === 0
			? ''
			: ir.parseWarnings.map(w => `<li>${escapeHtml(w)}</li>`).join('');
	}

	return {
		setIr(ir) {
			render(ir);
		},
		reset() {
			render(null);
		},
	};
}

function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}
