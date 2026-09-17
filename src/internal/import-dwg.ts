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

/**
 * 扩展包内路径（openIFrame 要求以 / 开头的完整路径）。
 *
 * 注意：这里的「扩展根目录」指**安装包（.eext）根目录**，不是仓库根目录。
 * 本扩展的编译产物放在 dist/ 下（见 extension.json 的 "entry": "./dist/index"），
 * 因此弹窗 HTML 的实际包内路径是 /dist/iframe/index.html，
 * 写成 /iframe/index.html 会因找不到文件而静默失败（窗口不弹出）。
 */
const IFRAME_HTML = '/dist/iframe/index.html';
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

	// 进入即记一条日志，便于在 EDA 日志面板确认菜单回调是否真的触发了
	// （若看不到这条，说明问题在菜单注册/registerFn 解析，而非本函数内部）。
	eda?.sys_Log?.info?.(`[DwgImporter] importDwg(${documentType}) → openIFrame ${IFRAME_HTML}`);

	// 失败时务必给出可见反馈：菜单点击「毫无反应」最难排查。
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
		// isIFrameAlreadyExist 可能存在也可能不存在，故用可选调用。
		try {
			if (await iframeApi.isIFrameAlreadyExist?.(IFRAME_ID)) {
				await iframeApi.closeIFrame?.(IFRAME_ID);
			}
		}
		catch {
			// 探测失败不应阻断主流程。
		}

		// openIFrame 不支持 query 参数，启动参数经 Storage 传递。
		await eda?.sys_Storage?.setExtensionUserConfig?.(KEY_LAUNCH, { documentType: effective });

		const opened = await iframeApi.openIFrame(IFRAME_HTML, 760, 660, IFRAME_ID, {
			maximizeButton: false,
			minimizeButton: false,
			grayscaleMask: false,
		});

		if (!opened) {
			eda?.sys_Dialog?.showInformationMessage?.(
				`无法打开弹窗。请确认扩展包内存在文件：${IFRAME_HTML}`,
				'DWG 导入器',
			);
		}
	}
	catch (err) {
		const message = (err as Error)?.message ?? String(err);
		eda?.sys_Log?.error?.('[DwgImporter] openIFrame failed:', message);
		eda?.sys_Dialog?.showInformationMessage?.(
			`打开弹窗失败：${message}`,
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
