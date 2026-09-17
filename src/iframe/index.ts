/**
 * 弹窗入口：初始化状态机、UI 组件、MessageBus；分发文件选择 / 解析 / 导入事件。
 */

import type { ApplyImportPayload, DwgIR, ImportDocumentType, PcbLayerInfo } from '../shared/types';
import type { State } from './state-machine';
import type { IframeStorage } from './storage';
import { t } from '../shared/i18n';
import { DEFAULT_OPTIONS } from '../shared/types';
import { PCB_LAYER_ID } from './dwg/layer-suggest';
import { parseDwg } from './dwg/parser';
import { onHostMessage, sendToHost } from './messagebus';
import { createStateMachine } from './state-machine';
import { createIframeStorage } from './storage';
import { createFileSection } from './ui/file-section';
import { injectStyles } from './ui/inject-styles';
import { createLayerMapping } from './ui/layer-mapping';
import { suggestAllByColor, suggestAllByName } from './ui/layer-suggest-bridge';
import { createOptionsSection } from './ui/options-section';
import { createPreviewSection } from './ui/preview-section';
import stylesCss from './ui/styles.css';

injectStyles(stylesCss);

const storage: IframeStorage = createIframeStorage();

const app = document.getElementById('app')!;
const headerEl = app.querySelector<HTMLElement>('[data-role="header"]')!;
const mainEl = app.querySelector<HTMLElement>('[data-role="main"]')!;
const footerEl = app.querySelector<HTMLElement>('[data-role="footer"]')!;
const importBtn = footerEl.querySelector<HTMLButtonElement>('[data-role="import-btn"]')!;
const cancelBtn = footerEl.querySelector<HTMLButtonElement>('[data-role="cancel-btn"]')!;

headerEl.querySelector<HTMLElement>('[data-role="title"]')!.textContent = t('Drop DWG file here or click to select');
headerEl.querySelector<HTMLElement>('[data-role="context"]')!.textContent = '';
cancelBtn.textContent = t('Cancel');
importBtn.textContent = t('Import');

const layerMap = createLayerMapping(mainEl.querySelector<HTMLElement>('[data-role="layer-mapping-section"]')!);
const optionsSec = createOptionsSection(mainEl.querySelector<HTMLElement>('[data-role="options-section"]')!);
const previewSec = createPreviewSection(mainEl.querySelector<HTMLElement>('[data-role="preview-section"]')!);
const fileSec = createFileSection(mainEl.querySelector<HTMLElement>('[data-role="file-section"]')!, () => {
	previewSec.reset();
});

const sm = createStateMachine();
let currentIr: DwgIR | null = null;
let currentDocType: ImportDocumentType = 'PCB';
let pcbLayers: PcbLayerInfo[] = buildPcbLayerList('PCB');

// Restore persistent options
(async () => {
	const w = await storage.getDefaultLineWidth();
	const u = await storage.getDefaultUnit();
	optionsSec.setOptions({
		...DEFAULT_OPTIONS,
		defaultLineWidthMil: w,
		units: u,
	});
	const lastDir = await storage.getLastDir();
	if (lastDir) {
		// 沙箱限制下仅 toast 提示，避免误以为支持

		console.warn(`[DwgImporter] lastDir=${lastDir}`);
	}
})();

fileSec.setStatusIdle();

onHostMessage((msg) => {
	if (msg.type === 'init') {
		currentDocType = msg.documentType;
		pcbLayers = buildPcbLayerList(msg.documentType);
		headerEl.querySelector<HTMLElement>('[data-role="context"]')!.textContent = msg.documentType;
	}
});

sendToHost({ type: 'ready' });

sm.subscribe((s) => {
	updateImportBtn(s);
});

function updateImportBtn(s: State): void {
	importBtn.disabled = s !== 'parsed';
	if (s === 'parsed' && currentIr) {
		importBtn.textContent = t('Import {0} primitives', String(currentIr.entities.length));
	}
	else if (s === 'importing') {
		importBtn.textContent = t('Status: importing {0}/{1}', '…', '…');
	}
	else {
		importBtn.textContent = t('Import');
	}
}

fileSec.onFileSelected(async (file) => {
	previewSec.reset();
	sm.transition('parsing');
	fileSec.setStatusParsing(0);

	try {
		const ir = await parseDwg(file, {
			onProgress: p => fileSec.setStatusParsing(p),
			maxEntities: 100_000,
			maxBytes: 50 * 1024 * 1024,
		});
		currentIr = ir;

		// 应用智能建议
		const colorMap = suggestAllByColor(
			ir.layers.map(l => ({ name: l.name, color: l.color })),
			pcbLayers,
		);
		const nameMap = suggestAllByName(ir.layers.map(l => ({ name: l.name })));
		const merged: Record<string, number | null> = {};
		for (const l of ir.layers) {
			merged[l.name] = nameMap[l.name] ?? colorMap[l.name] ?? null;
		}

		layerMap.setLayers(ir.layers, pcbLayers);
		layerMap.setMapping(merged);
		previewSec.setIr(ir);
		fileSec.setStatusParsed(ir.entities.length, ir.layers.length);
		sm.transition('parsed');
	}
	catch (err) {
		fileSec.setStatusError((err as Error).message);
		sm.transition('error');
	}
});

importBtn.addEventListener('click', () => {
	if (!currentIr)
		return;
	sm.transition('importing');
	const payload: ApplyImportPayload = {
		ir: currentIr,
		mapping: layerMap.getMapping(),
		options: optionsSec.getOptions(),
		documentType: currentDocType,
	};
	void storage.setLastDir('');
	void storage.setDefaultLineWidth(payload.options.defaultLineWidthMil);
	void storage.setDefaultUnit(payload.options.units);
	sendToHost({ type: 'apply-import', payload });
});

cancelBtn.addEventListener('click', () => {
	sendToHost({ type: 'cancel' });
	sm.transition('idle');
});

onHostMessage((msg) => {
	if (msg.type === 'apply-result') {
		sm.transition('done');

		console.warn(`[DwgImporter] import done: success=${msg.result.successCount} failed=${msg.result.failedCount}`);
		setTimeout(() => {
			sendToHost({ type: 'cancel' });
		}, 100);
	}
});

/** 静态 PCB 层清单（与 pro-api-types EPCB_LayerId 对齐）。 */
function buildPcbLayerList(docType: ImportDocumentType): PcbLayerInfo[] {
	if (docType === 'SCH') {
		return [{ id: PCB_LAYER_ID.Document, name: 'Document' }];
	}
	if (docType === 'FOOTPRINT') {
		return [
			{ id: PCB_LAYER_ID.Document, name: 'Document' },
			{ id: PCB_LAYER_ID.Mechanical1, name: 'Mechanical1' },
			{ id: PCB_LAYER_ID.Mechanical2, name: 'Mechanical2' },
			{ id: PCB_LAYER_ID.Mechanical3, name: 'Mechanical3' },
			{ id: PCB_LAYER_ID.Mechanical4, name: 'Mechanical4' },
			{ id: PCB_LAYER_ID.Mechanical5, name: 'Mechanical5' },
			{ id: PCB_LAYER_ID.Mechanical6, name: 'Mechanical6' },
			{ id: PCB_LAYER_ID.Mechanical7, name: 'Mechanical7' },
			{ id: PCB_LAYER_ID.Mechanical8, name: 'Mechanical8' },
			{ id: PCB_LAYER_ID.Mechanical9, name: 'Mechanical9' },
			{ id: PCB_LAYER_ID.Mechanical10, name: 'Mechanical10' },
		];
	}
	return [
		{ id: PCB_LAYER_ID.BoardOutline, name: 'BoardOutline' },
		{ id: PCB_LAYER_ID.TopLayer, name: 'TopLayer' },
		{ id: PCB_LAYER_ID.BottomLayer, name: 'BottomLayer' },
		{ id: PCB_LAYER_ID.TopSilkLayer, name: 'TopSilkLayer' },
		{ id: PCB_LAYER_ID.BottomSilkLayer, name: 'BottomSilkLayer' },
		{ id: PCB_LAYER_ID.Document, name: 'Document' },
		{ id: PCB_LAYER_ID.Mechanical1, name: 'Mechanical1' },
		{ id: PCB_LAYER_ID.Mechanical2, name: 'Mechanical2' },
		{ id: PCB_LAYER_ID.Mechanical3, name: 'Mechanical3' },
		{ id: PCB_LAYER_ID.Mechanical4, name: 'Mechanical4' },
		{ id: PCB_LAYER_ID.Mechanical5, name: 'Mechanical5' },
		{ id: PCB_LAYER_ID.Mechanical6, name: 'Mechanical6' },
		{ id: PCB_LAYER_ID.Mechanical7, name: 'Mechanical7' },
		{ id: PCB_LAYER_ID.Mechanical8, name: 'Mechanical8' },
		{ id: PCB_LAYER_ID.Mechanical9, name: 'Mechanical9' },
		{ id: PCB_LAYER_ID.Mechanical10, name: 'Mechanical10' },
	];
}
