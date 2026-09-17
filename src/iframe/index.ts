/**
 * 弹窗入口（自包含）。
 *
 * 架构：iframe 内直接访问全局 `eda` 对象（官方文档明确支持，无需 window.parent），
 * 因此解析、图层映射与写图元都在本文件内完成，没有跨帧消息层。
 *
 * 启动参数（documentType）由 host 在 openIFrame 前写入 sys_Storage，
 * 因为 openIFrame 不支持 query 参数。若读不到则回退到自行探测当前文档。
 */

import type { ApplyImportPayload, DwgIR, ImportDocumentType, PcbLayerInfo } from '../shared/types';
import type { State } from './state-machine';
import type { IframeStorage } from './storage';
import { DOC_TYPE, edaApi, LAYER } from '../shared/eda-api';
import { t } from '../shared/i18n';
import { DEFAULT_OPTIONS } from '../shared/types';
import { applyFootprintImport, applyPcbImport, applySchImport } from '../write/index';
import { parseDwg } from './dwg/parser';
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

/**
 * iframe 侧调试日志。
 *
 * 用于区分「弹窗根本没打开」与「弹窗打开了但内部报错/空白」。
 * iframe 内可直接访问全局 eda（官方文档确认），故直接写日志与 toast。
 */
function iframeLog(msg: string): void {
	const line = `[DwgImporter:iframe] ${msg}`;
	try {
		edaApi()?.sys_Log?.info?.(line);
	}
	catch { /* ignore */ }
	try {
		edaApi()?.sys_Message?.showToastMessage?.(line, undefined, 3000);
	}
	catch { /* ignore */ }
	// 同时打到浏览器控制台，便于在 DevTools 里查看。
	console.warn(line);
}

iframeLog('弹窗脚本已开始执行（说明 HTML 已成功加载并运行 JS）');

const storage: IframeStorage = createIframeStorage();
const IFRAME_ID = 'dwg-importer-window';

const app = document.getElementById('app')!;
const headerEl = app.querySelector<HTMLElement>('[data-role="header"]')!;
const mainEl = app.querySelector<HTMLElement>('[data-role="main"]')!;
const footerEl = app.querySelector<HTMLElement>('[data-role="footer"]')!;
const importBtn = footerEl.querySelector<HTMLButtonElement>('[data-role="import-btn"]')!;
const cancelBtn = footerEl.querySelector<HTMLButtonElement>('[data-role="cancel-btn"]')!;
const contextEl = headerEl.querySelector<HTMLElement>('[data-role="context"]')!;

headerEl.querySelector<HTMLElement>('[data-role="title"]')!.textContent = t('DWG Importer');
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
let targetLayers: PcbLayerInfo[] = buildLayerList('PCB');

// ── 初始化：文档类型 + 持久化选项 ──────────────────────────────
void init();

async function init(): Promise<void> {
	iframeLog(`init: Storage 中的启动参数=${JSON.stringify(storage.getLaunchParams())}`);
	const focusType = await detectDocumentType();
	iframeLog(`init: 焦点文档探测=${focusType ?? '(未取到)'}`);

	currentDocType = storage.getLaunchParams()?.documentType ?? focusType ?? 'PCB';
	targetLayers = buildLayerList(currentDocType);
	contextEl.textContent = currentDocType;
	iframeLog(`init: 最终采用 documentType=${currentDocType}，可映射目标层数=${targetLayers.length}`);

	const lastDir = storage.getLastDir();
	if (lastDir) {
		edaApi()?.sys_Message?.showToastMessage?.(t('Last directory: {0}', lastDir));
	}

	optionsSec.setOptions({
		...DEFAULT_OPTIONS,
		defaultLineWidthMil: storage.getDefaultLineWidth(),
		units: storage.getDefaultUnit(),
	});
	fileSec.setStatusIdle();
	updateImportBtn(sm.state);
	iframeLog('init: 完成，界面已就绪');
}

async function detectDocumentType(): Promise<ImportDocumentType | undefined> {
	try {
		const info = await edaApi()?.dmt_SelectControl?.getCurrentDocumentInfo?.();
		switch (info?.documentType) {
			case DOC_TYPE.PCB: return 'PCB';
			case DOC_TYPE.SCHEMATIC_PAGE: return 'SCH';
			case DOC_TYPE.FOOTPRINT: return 'FOOTPRINT';
			default: return undefined;
		}
	}
	catch {
		return undefined;
	}
}

sm.subscribe((s) => {
	updateImportBtn(s);
});

function updateImportBtn(s: State): void {
	importBtn.disabled = s !== 'parsed';
	if (s === 'parsed' && currentIr) {
		importBtn.textContent = t('Import {0} primitives', String(currentIr.entities.length));
	}
	else {
		importBtn.textContent = t('Import');
	}
}

// ── 文件选择 → 解析 → 智能建议 ────────────────────────────────
fileSec.onFileSelected(async (file) => {
	iframeLog(`选择文件：${file.name}（${file.size} 字节）`);
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
		iframeLog(`解析完成：图元 ${ir.entities.length} 个，图层 ${ir.layers.length} 个，单位=${ir.units}，警告 ${ir.parseWarnings.length} 条`);

		// 先按名字建议，未命中再退回颜色建议。
		const colorMap = suggestAllByColor(
			ir.layers.map(l => ({ name: l.name, color: l.color })),
			targetLayers,
		);
		const nameMap = suggestAllByName(ir.layers.map(l => ({ name: l.name })));
		const merged: Record<string, number | null> = {};
		for (const l of ir.layers) {
			merged[l.name] = nameMap[l.name] ?? colorMap[l.name] ?? null;
		}

		layerMap.setLayers(ir.layers, targetLayers);
		layerMap.setMapping(merged);
		previewSec.setIr(ir);
		fileSec.setStatusParsed(ir.entities.length, ir.layers.length);
		sm.transition('parsed');
		iframeLog('已进入 parsed 状态，「导入」按钮应已可用');
	}
	catch (err) {
		const m = (err as Error).message;
		iframeLog(`解析失败：${m}`);
		fileSec.setStatusError(m);
		sm.transition('error');
	}
});

// ── 导入：直接在 iframe 内写图元 ──────────────────────────────
importBtn.addEventListener('click', () => {
	if (!currentIr)
		return;

	const options = optionsSec.getOptions();
	const payload: ApplyImportPayload = {
		ir: currentIr,
		mapping: layerMap.getMapping(),
		options,
		documentType: currentDocType,
	};

	const enabledLayers = Object.values(payload.mapping).filter(v => v !== null && v !== undefined).length;
	iframeLog(`点击导入：documentType=${currentDocType}，已映射图层 ${enabledLayers} 个`);
	if (enabledLayers === 0) {
		iframeLog('没有选中任何图层映射，导入会跳过全部图元');
	}

	sm.transition('importing');
	void storage.setDefaultLineWidth(options.defaultLineWidthMil);
	void storage.setDefaultUnit(options.units);

	void runImport(payload);
});

async function runImport(payload: ApplyImportPayload): Promise<void> {
	const onProgress = (done: number, total: number): void => {
		fileSec.setStatusParsing(total > 0 ? Math.round((done / total) * 100) : 100);
	};

	try {
		const result = payload.documentType === 'SCH'
			? await applySchImport(payload, onProgress)
			: payload.documentType === 'FOOTPRINT'
				? await applyFootprintImport(payload, onProgress)
				: await applyPcbImport(payload, onProgress);

		sm.transition('done');
		iframeLog(`导入完成：成功 ${result.successCount} 个，失败 ${result.failedCount} 个`);
		const msg = result.failedCount > 0
			? t('Status: import done, {0} primitives created, {1} failed', String(result.successCount), String(result.failedCount))
			: t('Status: import done, {0} primitives created, {1} failed', String(result.successCount), '0');
		edaApi()?.sys_Message?.showToastMessage?.(msg);

		if (result.errors.length > 0) {
			iframeLog(`首个错误：${result.errors[0]?.message}`);
			edaApi()?.sys_Log?.warn?.('[DwgImporter] first error:', result.errors[0]?.message);
		}

		// 关闭弹窗，回到画布查看结果。
		setTimeout(() => {
			void edaApi()?.sys_IFrame?.closeIFrame?.(IFRAME_ID);
		}, 600);
	}
	catch (err) {
		sm.transition('error');
		const m = (err as Error).message;
		iframeLog(`导入抛异常：${m}`);
		const message = t('Import failed: {0}', m);
		fileSec.setStatusError(message);
		edaApi()?.sys_Message?.showToastMessage?.(message);
	}
}

cancelBtn.addEventListener('click', () => {
	void edaApi()?.sys_IFrame?.closeIFrame?.(IFRAME_ID);
});

// ── 目标层清单（id 对照 EPCB_LayerId 核实） ────────────────────
function buildLayerList(docType: ImportDocumentType): PcbLayerInfo[] {
	if (docType === 'SCH') {
		return [{ id: LAYER.DOCUMENT, name: 'Document' }];
	}
	if (docType === 'FOOTPRINT') {
		return [
			{ id: LAYER.TOP_SILKSCREEN, name: 'TopSilkscreen' },
			{ id: LAYER.MECHANICAL, name: 'Mechanical' },
			{ id: LAYER.DOCUMENT, name: 'Document' },
			{ id: LAYER.BOARD_OUTLINE, name: 'BoardOutline' },
		];
	}
	return [
		{ id: LAYER.BOARD_OUTLINE, name: 'BoardOutline' },
		{ id: LAYER.TOP, name: 'TopLayer' },
		{ id: LAYER.BOTTOM, name: 'BottomLayer' },
		{ id: LAYER.TOP_SILKSCREEN, name: 'TopSilkscreen' },
		{ id: LAYER.BOTTOM_SILKSCREEN, name: 'BottomSilkscreen' },
		{ id: LAYER.TOP_ASSEMBLY, name: 'TopAssembly' },
		{ id: LAYER.BOTTOM_ASSEMBLY, name: 'BottomAssembly' },
		{ id: LAYER.MECHANICAL, name: 'Mechanical' },
		{ id: LAYER.DOCUMENT, name: 'Document' },
	];
}
