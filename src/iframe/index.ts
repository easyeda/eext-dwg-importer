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

import type { ApplyImportPayload, DwgIR, ImportDocumentType, PcbLayerInfo, Rgb } from '../shared/types';
import type { State } from './state-machine';
import type { IframeStorage } from './storage';
import { DOC_TYPE, edaApi, LAYER } from '../shared/eda-api';
import { t } from '../shared/i18n';
import { DEFAULT_OPTIONS } from '../shared/types';
import { applyFootprintImport, applyPcbImport, applySchImport } from '../write/index';
import { pickOriginOnCanvas } from './canvas-pick';
import { computeBoundingBox } from './dwg/ir';
import { parseDwg } from './dwg/parser';
import { createStateMachine } from './state-machine';
import { createIframeStorage } from './storage';
import { need } from './ui/dom';
import { createFileSection } from './ui/file-section';
import { injectStyles } from './ui/inject-styles';
import { createLayerMapping } from './ui/layer-mapping';
import { suggestAllByColor, suggestAllByName } from './ui/layer-suggest-bridge';
import { createOptionsSection } from './ui/options-section';
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

/** 初始化界面与状态。仅在 DOM 就绪后调用。 */
function start(): void {
	const app = document.getElementById('app');
	if (!app) {
		edaApi()?.sys_Log?.error?.('[DwgImporter] 未找到根节点 #app，弹窗 HTML 可能未正确加载');
		return;
	}

	const mainEl = need(app, 'main');
	const footerEl = need(app, 'footer');
	const importBtn = need<HTMLButtonElement>(footerEl, 'import-btn');
	const cancelBtn = need<HTMLButtonElement>(footerEl, 'cancel-btn');

	/*
	 * 导入按钮文案固定为「导入」（用户要求不随状态变化）；
	 * 状态机只控制 disabled，进度展示由右侧文件状态条承担。
	 */
	cancelBtn.textContent = t('Cancel');
	importBtn.textContent = t('Import');

	const layerMap = createLayerMapping(need(mainEl, 'layer-mapping-section'));
	const optionsSec = createOptionsSection(need(mainEl, 'options-section'));
	// 文件状态条在右栏顶部（file-status-section），文件选择区只在左栏持有拖拽区。
	const fileSec = createFileSection(need(mainEl, 'file-section'), {
		name: need(mainEl, 'file-name'),
		status: need(mainEl, 'status'),
		size: need(mainEl, 'file-size'),
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

	// ── 原点偏移：画布拾取 ──────────────────────────────────────
	optionsSec.onPickOrigin(async () => {
		const picked = await pickOriginOnCanvas(currentDocType, IFRAME_ID);
		if (picked) {
			// 拾取返回文档数据层坐标：PCB/封装为 mil，原理图为 0.01 inch（×10 转 mil）。
			const mil = currentDocType === 'SCH'
				? { x: picked.x * 10, y: picked.y * 10 }
				: picked;
			optionsSec.setOriginOffset(mil);
			edaApi()?.sys_Message?.showToastMessage?.(
				t('Origin offset set: {0}, {1}', String(mil.x), String(mil.y)),
			);
			return mil;
		}
		return null;
	});

	function updateImportBtn(s: State): void {
		importBtn.disabled = s !== 'parsed';
	}

	// ── 文件选择 → 解析 → 智能建议 ──────────────────────────────
	fileSec.onFileSelected(async (file) => {
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
			// 整体 bbox（图纸原始单位）：数值量级是用户选导入单位的直接依据。
			const bbox = computeBoundingBox(ir.entities);
			fileSec.setStatusParsed(
				ir.entities.length,
				ir.layers.length,
				resolvedUnitLabel(ir),
				{ width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY },
			);
			reportParseWarnings(ir);
			sm.transition('parsed');
		}
		catch (err) {
			/*
			 * 状态条是固定高度的单行省略，长原因会被截断，
			 * 故解析失败同时写日志 + toast（与导入失败的兜底一致），
			 * 避免用户只能看到半句原因。
			 */
			const message = t('Status: parse failed: {0}', (err as Error).message);
			fileSec.setStatusError(message);
			edaApi()?.sys_Log?.error?.('[DwgImporter] 解析失败:', (err as Error).message);
			edaApi()?.sys_Message?.showToastMessage?.(message);
			sm.transition('error');
		}
	});

	/**
	 * 解析完成时状态栏显示最终生效的单位。
	 * 「自动」按 IR 检测结果（INSUNITS）显示；手动选择的单位原样显示。
	 * 未知/无单位时明确标注「按 mm 处理」——此前单位误判正是放大 25.4 倍的根因，
	 * 把单位亮出来便于实机核对。
	 */
	function resolvedUnitLabel(ir: DwgIR): string {
		const selected = optionsSec.getOptions().units;
		const units = selected === 'auto' ? ir.units : selected;
		return units === 'unknown' ? t('unknown, treated as mm') : units;
	}

	/**
	 * 解析警告（如外部参照被跳过）原来展示在预览区；预览区移除后，
	 * 改为日志留痕 + 一条汇总 toast，保证「跳过 XREF」这类提示不静默丢失。
	 */
	function reportParseWarnings(ir: DwgIR): void {
		if (ir.parseWarnings.length === 0)
			return;
		edaApi()?.sys_Log?.warn?.(
			`[DwgImporter] 解析警告 ×${ir.parseWarnings.length}`,
			ir.parseWarnings.slice(0, 20),
		);
		edaApi()?.sys_Message?.showToastMessage?.(
			t('Parsed with {0} warning(s). Details are in the log.', String(ir.parseWarnings.length)),
		);
	}

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

			/*
			 * 一个都没创建、也没失败 = 全部被映射/选项过滤掉了
			 * （几乎总是所有图层都停在「不导入」）。
			 * 此时保持弹窗打开并明确告知原因，而不是显示误导性的
			 * 「导入完成：0 个图元」后直接关闭——那会让用户以为导入成功了。
			 */
			if (result.successCount === 0 && result.failedCount === 0) {
				sm.transition('error');
				const message = t('Nothing imported: all layers are unmapped or filtered. Check the layer mapping and options.');
				fileSec.setStatusError(message);
				edaApi()?.sys_Message?.showToastMessage?.(message);
				return;
			}

			sm.transition('done');
			edaApi()?.sys_Message?.showToastMessage?.(
				t('Status: import done, {0} primitives created, {1} failed', String(result.successCount), String(result.failedCount)),
			);

			if (result.errors.length > 0) {
				edaApi()?.sys_Log?.warn?.('[DwgImporter] 首个错误:', result.errors[0]?.message);
			}

			/*
			 * 缩放到全部图元（README 承诺了「完成后自动缩放」）。
			 * DWG 原始坐标换算成 mil 后往往离当前视野很远，
			 * 不缩放的话用户回到画布只会看到「什么都没有」，
			 * 从而把成功的导入误报为「没有线条生成」。
			 */
			try {
				const bounds = await edaApi()?.dmt_EditorControl?.zoomToAllPrimitives?.();
				if (!bounds)
					edaApi()?.sys_Log?.warn?.('[DwgImporter] zoomToAllPrimitives 返回 false 或 API 缺失，视野未移动');
			}
			catch (zoomErr) {
				// 缩放失败不影响导入结果，仅记录。
				edaApi()?.sys_Log?.warn?.('[DwgImporter] 导入后缩放失败:', (zoomErr as Error).message);
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

/**
 * 目标层清单（id 对照 EPCB_LayerId 核实）。
 *
 * color 是各层的**近似默认色**（取自 EDA 常见配色，非逐版本精确值），
 * 供图层建议的颜色匹配使用：matchByColor 会跳过没有 color 的目标层，
 * 不提供颜色则「按颜色匹配」永远返回空（这是曾经的实际缺陷）。
 */
function buildLayerList(docType: ImportDocumentType): PcbLayerInfo[] {
	const docColor: Rgb = { r: 192, g: 192, b: 192 };
	if (docType === 'SCH') {
		return [{ id: LAYER.DOCUMENT, name: 'Document', color: docColor }];
	}
	if (docType === 'FOOTPRINT') {
		return [
			{ id: LAYER.TOP_SILKSCREEN, name: 'TopSilkscreen', color: { r: 255, g: 255, b: 0 } },
			{ id: LAYER.MECHANICAL, name: 'Mechanical', color: { r: 128, g: 0, b: 0 } },
			{ id: LAYER.DOCUMENT, name: 'Document', color: docColor },
			{ id: LAYER.BOARD_OUTLINE, name: 'BoardOutline', color: { r: 255, g: 0, b: 255 } },
		];
	}
	return [
		{ id: LAYER.BOARD_OUTLINE, name: 'BoardOutline', color: { r: 255, g: 0, b: 255 } },
		{ id: LAYER.TOP, name: 'TopLayer', color: { r: 255, g: 0, b: 0 } },
		{ id: LAYER.BOTTOM, name: 'BottomLayer', color: { r: 0, g: 0, b: 255 } },
		{ id: LAYER.TOP_SILKSCREEN, name: 'TopSilkscreen', color: { r: 255, g: 255, b: 0 } },
		{ id: LAYER.BOTTOM_SILKSCREEN, name: 'BottomSilkscreen', color: { r: 0, g: 255, b: 255 } },
		{ id: LAYER.TOP_ASSEMBLY, name: 'TopAssembly', color: { r: 128, g: 128, b: 128 } },
		{ id: LAYER.BOTTOM_ASSEMBLY, name: 'BottomAssembly', color: { r: 128, g: 128, b: 128 } },
		{ id: LAYER.MECHANICAL, name: 'Mechanical', color: { r: 128, g: 0, b: 0 } },
		{ id: LAYER.DOCUMENT, name: 'Document', color: docColor },
	];
}
