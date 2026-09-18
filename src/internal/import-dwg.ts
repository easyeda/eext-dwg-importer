/**
 * 菜单入口：打开 DWG 导入弹窗。
 *
 * 架构说明（对照官方 iframe_custom_ui 文档核实）：
 * - 打开内联框架使用 sys_IFrame.openIFrame(htmlFileName, w, h, id, props)。
 * - 没有 sendMessageToIframe / onIframeMessage 这类跨帧通信 API。
 * - iframe 内可直接访问注入的 `eda`（无需 window.parent），
 *   因此解析与写图元全部在 iframe 内完成，本文件只负责「打开窗口」。
 * - openIFrame 不支持 query 参数，启动参数通过 sys_Storage 传递。
 *
 * ⚠️ 路径注意：htmlFileName 以**安装包（.eext）根目录**为基准。
 * 本扩展的编译产物在 dist/ 下（见 extension.json 的 "entry": "./dist/index"），
 * 故弹窗 HTML 的包内路径是 /dist/iframe/index.html。
 * 该路径由 build/iframe.ts 的 assertHtmlPaths() 在构建期校验，勿手改。
 */

import type { ImportDocumentType } from '../shared/types';
import { KEY_LAUNCH } from '../iframe/storage';
import { DOC_TYPE, edaApi } from '../shared/eda-api';

const IFRAME_HTML = '/dist/iframe/index.html';
const IFRAME_ID = 'dwg-importer-window';

/**
 * 弹窗尺寸。
 *
 * 采用左右两栏布局（左：文件 + 图层映射；右：选项），
 * 故需要比单列布局更宽；高度取 620 以在常见屏幕下不超出可视区
 * （EDA 会把该高度再加上标题栏高度）。
 */
const IFRAME_WIDTH = 920;
const IFRAME_HEIGHT = 620;

/**
 * 被 src/index.ts 的三个 registerFn 调用。
 *
 * EDA 已按编辑器环境分组菜单，故传入的 documentType 与当前环境一致。
 */
export async function importDwg(documentType: ImportDocumentType): Promise<void> {
	const eda = edaApi();
	const iframeApi = eda?.sys_IFrame;

	if (!iframeApi?.openIFrame) {
		eda?.sys_Log?.error?.('[DwgImporter] sys_IFrame.openIFrame 不可用');
		eda?.sys_Dialog?.showInformationMessage?.(
			'当前环境不支持内联框架（sys_IFrame.openIFrame 不可用）',
			'DWG 导入器',
		);
		return;
	}

	/*
	 * 文档类型以「菜单传入值」为准。
	 *
	 * 菜单已按编辑器环境分组（pcb / sch / footprint），传入值与当前环境必然一致；
	 * 而 getCurrentDocumentInfo() 依赖「最后获得输入焦点的文档」，分屏或焦点异常时
	 * 可能返回其它文档。若让它反向覆盖菜单值，会出现「在封装编辑器里却按 PCB 导入」。
	 */
	const detected = await detectDocumentType();
	if (detected && detected !== documentType) {
		eda?.sys_Log?.warn?.(`[DwgImporter] 菜单=${documentType}，焦点文档=${detected}，按菜单值处理`);
	}

	try {
		// 重复点击时先关掉旧窗口，避免多开。
		try {
			if (await iframeApi.isIFrameAlreadyExist?.(IFRAME_ID)) {
				await iframeApi.closeIFrame?.(IFRAME_ID);
			}
		}
		catch {
			// 探测失败不应阻断主流程。
		}

		// openIFrame 不支持 query 参数，启动参数经 Storage 传递。
		await eda?.sys_Storage?.setExtensionUserConfig?.(KEY_LAUNCH, { documentType });

		const opened = await iframeApi.openIFrame(IFRAME_HTML, IFRAME_WIDTH, IFRAME_HEIGHT, IFRAME_ID, {
			/*
			 * 标题用 sys_I18n.text() 翻译后传入。
			 *
			 * EDA 决定窗口标题的优先级是 props.title > HTML 的 title 标签
			 * （见 ui.js：ae.open({ title: props.title || htmlTitle })）。
			 * HTML 里的 title 只能写死一种语言，故这里显式传翻译后的标题。
			 */
			title: eda?.sys_I18n?.text?.('Import DWG') ?? 'Import DWG',
			maximizeButton: false,
			// 最小化 = 折叠成标题栏（collapsed）：导入参数确认期间可收起弹窗查看画布。
			minimizeButton: true,
			minimizeStyle: 'collapsed',
			grayscaleMask: false,
		});

		if (!opened) {
			eda?.sys_Log?.error?.(`[DwgImporter] openIFrame 返回 false，路径=${IFRAME_HTML}`);
			eda?.sys_Dialog?.showInformationMessage?.(
				`无法打开弹窗。请确认扩展包内存在文件：${IFRAME_HTML}`,
				'DWG 导入器',
			);
		}
	}
	catch (err) {
		const message = (err as Error)?.message ?? String(err);
		eda?.sys_Log?.error?.('[DwgImporter] openIFrame 抛出异常:', message);
		eda?.sys_Dialog?.showInformationMessage?.(`打开弹窗失败：${message}`, 'DWG 导入器');
	}
}

/** 读取当前文档类型；失败返回 undefined。 */
async function detectDocumentType(): Promise<ImportDocumentType | undefined> {
	try {
		const info = await edaApi()?.dmt_SelectControl?.getCurrentDocumentInfo?.();
		if (!info)
			return undefined;
		switch (info.documentType) {
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
