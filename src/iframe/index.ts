/**
 * 弹窗入口（自包含）。
 *
 * 架构：iframe 内直接访问注入的 `eda` 对象（经 edaApi() 获取），
 * 因此解析、图层映射与写图元都在本文件内完成，没有跨帧消息层。
 *
 * 启动参数（documentType）由主进程在 openIFrame 前写入 sys_Storage，
 * 因为 openIFrame 不支持 query 参数。若读不到则回退到自行探测当前文档。
 *
 * 注意：本文件顶层不直接读 DOM。EDA 通过 blob URL 注入页面，
 * 脚本执行时机不完全受控，故统一在 bootstrap() 中等待 DOM 就绪后再初始化。
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

const storage: IframeStorage = createIframeStorage();
const IFRAME_ID = 'dwg-importer-window';

void bootstrap();

/** 启动：等待 DOM 就绪后初始化界面。 */
async function bootstrap(): Promise<void> {
	await domReady();
	try {
		start();
	}
	catch (err) {
		// 初始化异常必须留痕，否则弹窗只会是一片空白。
		edaApi()?.sys_Log?.error?.('[DwgImporter] 弹窗初始化失败:', (err as Error).message);
		edaApi()?.sys_Message?.showToastMessage?.(`弹窗初始化失败：${(err as Error).message}`);
	}
}

/**
 * 等待 DOM 就绪。
 *
 * 脚本已放在 body 末尾，正常情况 readyState 已是 interactive/complete；
 * 这里只是兜底，避免注入时序差异导致 getElementById 返回 null。
 */
function domReady(): Promise<void> {
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		return Promise.resolve();
	}
	return new Promise<void>((resolve) => {
		document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
	});
}

/**
 * 按 data-role 查找子元素；找不到时抛出带明确信息的错误。
 *
 * 不用 `querySelector(...)!` 的原因：非空断言只在编译期有效，
 * 一旦 HTML 漏写属性，运行时得到 null 后会以
 * 「Cannot read properties of null」的形式中断整个初始化，
 * 弹窗只显示静态骨架，极难定位。这里改为直接点明缺少哪个 data-role。
 *
 * 另：build/iframe.ts 的 assertDataRoles() 会在构建期拦截此类遗漏。
 */
function need<T extends HTMLElement>(root: ParentNode, role: string): T {
	const el = root.querySelector<T>(`[data-role="${role}"]`);
	if (!el) {
		throw new Error(`弹窗 HTML 缺少 data-role="${role}" 的元素`);
	}
	return el;
}

/** 初始化界面与状态。仅在 DOM 就绪后调用。 */
function start(): void {
	const app = document.getElementById('app');
	if (!app) {
		edaApi()?.sys_Log?.error?.('[DwgImporter] 未找到根节点 #app，弹窗 HTML 可能未正确加载');
		return;
	}

	const headerEl = need(app, 'header');
	const mainEl = need(app, 'main');
	const footerEl = need(app, 'footer');
	const importBtn = need<HTMLButtonElement>(footerEl, 'import-btn');
	const cancelBtn = need<HTMLButtonElement>(footerEl, 'cancel-btn');
	const contextEl = need(headerEl, 'context');

	need(headerEl, 'title').textContent = t('DWG Importer');
	cancelBtn.textContent = t('Cancel');
	importBtn.textContent = t('Import');

	const layerMap = createLayerMapping(need(mainEl, 'layer-mapping-section'));
	const optionsSec = createOptionsSection(need(mainEl, 'options-section'));
	const previewSec = createPreviewSection(need(mainEl, 'preview-section'));
	const fileSec = createFileSection(need(mainEl, 'file-section'), () => {
		previewSec.reset();
	});

	const sm = createStateMachine();
	let currentIr: DwgIR | null = null;
	let currentDocType: ImportDocumentType = 'PCB';
	let targetLayers: PcbLayerInfo[] = buildLayerList('PCB');

	// ── 初始化：文档类型 + 持久化选项 ────────────────────────────
	void init();

	async function init(): Promise<void> {
		currentDocType = storage.getLaunchParams()?.documentType ?? await detectDocumentType() ?? 'PCB';
		targetLayers = buildLayerList(currentDocType);
		contextEl.textContent = currentDocType;

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

	// ── 文件选择 → 解析 → 智能建议 ──────────────────────────────
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
		}
		catch (err) {
			fileSec.setStatusError((err as Error).message);
			sm.transition('error');
		}
	});

	// ── 导入：直接在 iframe 内写图元 ────────────────────────────
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
			edaApi()?.sys_Message?.showToastMessage?.(
				t('Status: import done, {0} primitives created, {1} failed', String(result.successCount), String(result.failedCount)),
			);

			if (result.errors.length > 0) {
				edaApi()?.sys_Log?.warn?.('[DwgImporter] 首个错误:', result.errors[0]?.message);
			}

			// 关闭弹窗，回到画布查看结果。
			setTimeout(() => {
				void edaApi()?.sys_IFrame?.closeIFrame?.(IFRAME_ID);
			}, 600);
		}
		catch (err) {
			sm.transition('error');
			const message = t('Import failed: {0}', (err as Error).message);
			fileSec.setStatusError(message);
			edaApi()?.sys_Message?.showToastMessage?.(message);
		}
	}

	cancelBtn.addEventListener('click', () => {
		void edaApi()?.sys_IFrame?.closeIFrame?.(IFRAME_ID);
	});
}

/** 读取当前文档类型；失败返回 undefined。 */
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

/** 目标层清单（id 对照 EPCB_LayerId 核实）。 */
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
