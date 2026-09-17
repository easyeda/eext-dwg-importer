/**
 * 菜单入口：打开 DWG 导入弹窗。
 *
 * 架构说明（对照官方 iframe_custom_ui 文档核实）：
 * - 打开内联框架使用 sys_IFrame.openIFrame(htmlFileName, w, h, id, props)。
 * - 没有 sendMessageToIframe / onIframeMessage 这类跨帧通信 API。
 * - iframe 内可直接使用全局 `eda` 对象（无需 window.parent），
 *   因此解析与写图元全部在 iframe 内完成，本文件只负责“打开窗口”。
 * - openIFrame 不支持 query 参数，启动参数通过 sys_Storage 传递。
 */

import type { ImportDocumentType } from '../shared/types';
import { KEY_LAUNCH } from '../iframe/storage';
import { DOC_TYPE, edaApi } from '../shared/eda-api';

/** 扩展包内路径（openIFrame 要求以 / 开头的完整路径）。 */
const IFRAME_HTML = '/iframe/index.html';
/** 固定窗口 id，便于重复打开时先关闭旧窗口。 */
const IFRAME_ID = 'dwg-importer-window';

/**
 * 被 src/menu.ts 的三个 registerFn 调用。
 *
 * EDA 框架已保证菜单只在目标编辑器环境下可点击；
 * 这里仍读取一次当前文档类型，作为给 iframe 的提示参数。
 */
export async function importDwg(documentType: ImportDocumentType): Promise<void> {
	const eda = edaApi();
	const iframeApi = eda?.sys_IFrame;

	if (!iframeApi?.openIFrame) {
		eda?.sys_Dialog?.showInformationMessage?.(
			'当前环境不支持内联框架（sys_IFrame.openIFrame 不可用）',
			'DWG 导入器',
		);
		return;
	}

	// 用真实文档类型覆盖菜单传入值：两者不一致时以当前文档为准。
	const detected = await detectDocumentType();
	const effective = detected ?? documentType;

	try {
		// 重复点击时先关掉旧窗口，避免出现多个弹窗。
		if (await iframeApi.isIFrameAlreadyExist?.(IFRAME_ID)) {
			await iframeApi.closeIFrame?.(IFRAME_ID);
		}

		// openIFrame 不支持 query 参数，启动参数经 Storage 传递。
		await eda?.sys_Storage?.setExtensionUserConfig?.(KEY_LAUNCH, { documentType: effective });

		const opened = await iframeApi.openIFrame(IFRAME_HTML, 760, 660, IFRAME_ID, {
			title: 'DWG 导入器',
			maximizeButton: false,
			minimizeButton: false,
			grayscaleMask: false,
		});

		if (!opened) {
			eda?.sys_Dialog?.showInformationMessage?.(
				`无法打开弹窗（文件路径：${IFRAME_HTML}）`,
				'DWG 导入器',
			);
		}
	}
	catch (err) {
		eda?.sys_Log?.error?.('[DwgImporter] openIFrame failed:', (err as Error).message);
		eda?.sys_Dialog?.showInformationMessage?.(
			`打开弹窗失败：${(err as Error).message}`,
			'DWG 导入器',
		);
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
