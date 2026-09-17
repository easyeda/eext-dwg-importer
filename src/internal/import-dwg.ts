/**
 * 菜单入口：打开 DWG 导入弹窗。
 *
 * 架构说明（对照官方 iframe_custom_ui 文档核实）：
 * - 打开内联框架使用 sys_IFrame.openIFrame(htmlFileName, w, h, id, props)。
 * - 没有 sendMessageToIframe / onIframeMessage 这类跨帧通信 API。
 * - iframe 内可直接使用全局 `eda` 对象（无需 window.parent），
 *   因此解析与写图元全部在 iframe 内完成，本文件只负责“打开窗口”。
 * - openIFrame 不支持 query 参数，启动参数通过 sys_Storage 传递。
 *
 * ⚠️ 调试模式：见 DEBUG_VERBOSE。定位「点菜单无反应」期间开启，
 * 每一步都会写日志并弹 toast，便于判定断在哪一环。定位完应关闭。
 */

import type { ImportDocumentType } from '../shared/types';
import { KEY_LAUNCH } from '../iframe/storage';
import { DOC_TYPE, edaApi } from '../shared/eda-api';

/** 调试开关：开启后每个步骤都会 toast + 记日志。 */
const DEBUG_VERBOSE = true;

/**
 * 扩展包内路径（openIFrame 要求以 / 开头的完整路径）。
 *
 * 注意：这里的「扩展根目录」指安装包（.eext）根目录，不是仓库根目录。
 * 本扩展的编译产物放在 dist/ 下（见 extension.json 的 "entry": "./dist/index"），
 * 因此弹窗 HTML 的包内路径是 /dist/iframe/index.html。
 */
const IFRAME_HTML = '/dist/iframe/index.html';
/** 固定窗口 id，便于重复打开时先关闭旧窗口。 */
const IFRAME_ID = 'dwg-importer-window';

const TAG = '[DwgImporter]';

/**
 * 分步上报：同时走「日志面板」与「界面 toast」两条通道。
 *
 * 之所以两条都走：日志面板在部分环境可能为空，而 toast 一定显示在界面上，
 * 二者互补可以避免「以为没执行、其实只是日志没记」的误判。
 */
function step(msg: string): void {
	const eda = edaApi();
	const line = `${TAG} ${msg}`;
	try {
		eda?.sys_Log?.info?.(line);
	}
	catch { /* 日志失败不应影响主流程 */ }
	if (DEBUG_VERBOSE) {
		try {
			eda?.sys_Message?.showToastMessage?.(line, undefined, 3000);
		}
		catch { /* 同上 */ }
	}
}

/** 致命错误：弹系统对话框，确保用户一定看得到。 */
function fatal(title: string, detail: string): void {
	const eda = edaApi();
	try {
		eda?.sys_Log?.error?.(`${TAG} ${detail}`);
	}
	catch { /* ignore */ }
	try {
		eda?.sys_Dialog?.showInformationMessage?.(detail, title);
	}
	catch { /* ignore */ }
}

/**
 * 被 src/index.ts 的三个 registerFn 调用。
 *
 * EDA 框架已按编辑器环境分组菜单，故传入的 documentType 与当前环境一致。
 */
export async function importDwg(documentType: ImportDocumentType): Promise<void> {
	// ① 入口：能走到这里说明菜单 → registerFn → 本函数 这条链路是通的。
	step(`① 菜单回调已触发，documentType=${documentType}`);

	const eda = edaApi();
	if (!eda) {
		fatal('DWG 导入器', '无法访问 eda 全局对象（扩展可能未正确加载）。');
		return;
	}

	const iframeApi = eda.sys_IFrame;
	step(`② sys_IFrame 可用=${!!iframeApi}，openIFrame 可用=${!!iframeApi?.openIFrame}，closeIFrame 可用=${!!iframeApi?.closeIFrame}`);
	step(`③ eda.extensionUuid=${eda.extensionUuid ?? '(undefined)'}`);

	if (!iframeApi?.openIFrame) {
		fatal('DWG 导入器', '当前环境不支持内联框架（sys_IFrame.openIFrame 不可用）。');
		return;
	}

	// ② 记录当前文档类型，便于排查环境不一致（仅记日志，不覆盖菜单值）。
	const detected = await detectDocumentType();
	step(`④ 焦点文档类型探测结果=${detected ?? '(未取到)'}，采用菜单值=${documentType}`);

	const effective = documentType;

	try {
		// ③ 重复点击时先关旧窗口，避免多开。
		try {
			const existed = await iframeApi.isIFrameAlreadyExist?.(IFRAME_ID);
			step(`⑤ isIFrameAlreadyExist(${IFRAME_ID})=${existed}`);
			if (existed) {
				await iframeApi.closeIFrame?.(IFRAME_ID);
				step('⑥ 已关闭旧窗口');
			}
		}
		catch (e) {
			step(`⑤ 探测旧窗口失败（忽略）：${(e as Error).message}`);
		}

		// ④ 写启动参数（openIFrame 不支持 query 参数）。
		try {
			await eda.sys_Storage?.setExtensionUserConfig?.(KEY_LAUNCH, { documentType: effective });
			step(`⑦ 启动参数已写入 Storage：${JSON.stringify({ documentType: effective })}`);
		}
		catch (e) {
			step(`⑦ 写 Storage 失败：${(e as Error).message}`);
		}

		// ⑤ 关键一步：打开窗口。失败最常见的原因是包内路径不存在。
		step(`⑧ 调用 openIFrame('${IFRAME_HTML}', 760, 660, '${IFRAME_ID}')`);
		const opened = await iframeApi.openIFrame(IFRAME_HTML, 760, 660, IFRAME_ID, {
			maximizeButton: false,
			minimizeButton: false,
			grayscaleMask: false,
		});
		step(`⑨ openIFrame 返回=${opened}`);

		if (!opened) {
			fatal(
				'DWG 导入器',
				`打开弹窗失败（openIFrame 返回 false）。\n`
				+ `尝试的包内路径：${IFRAME_HTML}\n`
				+ '请确认该文件存在于扩展包内。',
			);
		}
		else {
			step('⑩ 弹窗已打开，应能在界面上看到窗口');
		}
	}
	catch (err) {
		const message = (err as Error)?.message ?? String(err);
		fatal('DWG 导入器', `打开弹窗抛出异常：${message}`);
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
