/**
 * 入口文件 / Entry File
 *
 * 本文件为 pro-api-sdk 默认扩展入口；headerMenus 中的 registerFn 通过 export 函数名解析。
 *
 * 菜单注册逻辑写在 extension.json；运行时初始化（如有）写在 activate()。
 */
import extensionConfig from '../extension.json' with { type: 'json' };

// eslint-disable-next-line unused-imports/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {
	// 静态菜单注册已在 extension.json 中完成；此处可留作未来运行时初始化。
}

export function about(): void {
	const eda = (globalThis as unknown as { eda?: { sys_Dialog?: { showInformationMessage: (msg: string, title: string) => void }; sys_I18n?: { text: (key: string, ...args: unknown[]) => string } } }).eda;
	eda?.sys_Dialog?.showInformationMessage(
		`${eda?.sys_I18n?.text?.('DWG Importer v', extensionConfig.version) ?? `DWG Importer v${extensionConfig.version}`}\n${eda?.sys_I18n?.text?.('DWG Importer Description') ?? ''}`,
		eda?.sys_I18n?.text?.('About DWG Importer') ?? 'About DWG Importer',
	);
}

export { importDwgFootprint, importDwgPcb, importDwgSch } from './menu';
