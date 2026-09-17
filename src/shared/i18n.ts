/**
 * 共享 i18n 工具：基于 eda.sys_I18n.text 的薄包装。
 *
 * 用法：`t('Status: parsing {0}%', String(percent))`
 *
 * 注意：eda.sys_I18n.text 在 eda.* 全局对象上。弹窗与主进程共享此函数。
 */

export type I18nArgs = ReadonlyArray<string | number>;

export function t(key: string, ...args: I18nArgs): string {
	const edaI18n = (globalThis as unknown as { eda?: { sys_I18n?: { text?: (k: string, ...a: I18nArgs) => string } } }).eda?.sys_I18n;
	if (edaI18n?.text) {
		return edaI18n.text(key, ...args);
	}
	// dev / 独立测试环境的回退：按 ICU 占位符 ${1}/${2} 替换为 args[0]/args[1]
	let s = key;
	args.forEach((arg, i) => {
		s = s.replaceAll(`\${${i + 1}}`, String(arg));
	});
	return s;
}
