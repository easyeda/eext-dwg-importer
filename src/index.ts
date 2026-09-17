/**
 * 入口文件 / Entry File
 *
 * 本文件为 pro-api-sdk 默认扩展入口；headerMenus 中的 registerFn 通过 export 函数名解析。
 *
 * 注意：官方要求 registerFn 对应的方法「使用 export 将指定方法作为 ES Module 导出」。
 * 这里刻意使用**函数声明式导出**（export function foo()），而不是
 * `export { foo } from './x'` 这种 re-export 形式——后者在部分加载器下
 * 不会被视为本模块的具名导出，可能导致点击菜单无反应。
 */
import extensionConfig from '../extension.json' with { type: 'json' };

import { importDwg } from './internal/import-dwg';
import { edaApi } from './shared/eda-api';

const TAG = '[DwgImporter]';

/**
 * 入口级日志：用于把「菜单回调没触发」与「触发了但内部失败」区分开。
 *
 * 若点击菜单后连这条都看不到，说明问题在 extension.json 菜单注册或
 * registerFn 名称解析，与导入逻辑无关。
 *
 * 注意：必须经 edaApi() 取 eda（它引用 EDA 注入的裸标识符），
 * 不能用 globalThis.eda —— 后者在 EDA 中并不存在。
 */
function entryLog(fnName: string, documentType: string): void {
	const eda = edaApi();
	const line = `${TAG} ${fnName}() 被调用 (documentType=${documentType})`;
	try {
		eda?.sys_Log?.info?.(line);
	}
	catch { /* ignore */ }
	try {
		eda?.sys_Message?.showToastMessage?.(line, undefined, 3000);
	}
	catch { /* ignore */ }
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {
	// 静态菜单注册已在 extension.json 中完成；此处可留作未来运行时初始化。
}

export function about(): void {
	const eda = edaApi();
	eda?.sys_Dialog?.showInformationMessage?.(
		`${eda?.sys_I18n?.text?.('DWG Importer v', extensionConfig.version) ?? `DWG Importer v${extensionConfig.version}`}\n${eda?.sys_I18n?.text?.('DWG Importer Description') ?? ''}`,
		eda?.sys_I18n?.text?.('About DWG Importer') ?? 'About DWG Importer',
	);
}

/** PCB 编辑器菜单入口。 */
export function importDwgPcb(): Promise<void> {
	entryLog('importDwgPcb', 'PCB');
	return importDwg('PCB');
}

/** 原理图编辑器菜单入口。 */
export function importDwgSch(): Promise<void> {
	entryLog('importDwgSch', 'SCH');
	return importDwg('SCH');
}

/** 封装编辑器菜单入口。 */
export function importDwgFootprint(): Promise<void> {
	entryLog('importDwgFootprint', 'FOOTPRINT');
	return importDwg('FOOTPRINT');
}
