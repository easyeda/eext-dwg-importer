/**
 * 共享 i18n 工具：基于 eda.sys_I18n.text 的薄包装。
 *
 * 用法：`t('Status: parsing {0}%', 42)`
 *
 * ⚠️ 三个关键点（均已对照 pro-api-types 与实机核实）：
 *
 * 1. `eda` 是 EDA 注入的**函数参数**（入口代码被包在 `async function (eda) {...}` 中），
 *    `globalThis.eda` 并不存在。故此处走 edaApi() 引用裸标识符。
 *
 * 2. SYS_I18n.text 的真实签名含 namespace / language 两个占位参数：
 *      text(tag: string, namespace?: string, language?: string, ...args: any[]): string
 *    因此插值参数必须放在第 4 个位置起，否则会被当成 namespace 而错位。
 *
 * 3. **`text()` 自身不做任何插值**（实机逐个验证过 `{0}` / `${0}` / `%s` / `%1`
 *    四种风格，全部原样返回）。插值必须由本函数完成，
 *    否则界面上会出现字面量「解析失败：{0}」。
 *    locales/*.json 统一使用 `{0}` 风格，故此处以其为准。
 *
 * iframe 内同样可访问 eda（官方文档确认），故本函数在主进程与 iframe 中通用。
 */

import type { EdaGlobals } from './eda-api';
import { edaApi } from './eda-api';

export type I18nArgs = ReadonlyArray<string | number>;

type I18nLike = Pick<EdaGlobals, 'sys_I18n'>;

/**
 * 把 locale 模板里的占位符替换为实参。
 *
 * 支持两种风格：
 * - `{0}`  —— locales/*.json 的主用风格（含重复出现，全部替换）
 * - `${1}` —— 兼容写法，注意其序号是 **1 起**
 */
export function format(template: string, args: I18nArgs): string {
	return template
		.replace(/\{(\d+)\}/g, (whole, idx: string) => {
			const i = Number(idx);
			return i < args.length ? String(args[i]) : whole;
		})
		.replace(/\$\{(\d+)\}/g, (whole, idx: string) => {
			const i = Number(idx) - 1;
			return i >= 0 && i < args.length ? String(args[i]) : whole;
		});
}

export function t(key: string, ...args: I18nArgs): string {
	let translated: string | undefined;
	try {
		translated = (edaApi() as I18nLike | undefined)?.sys_I18n?.text?.(key, undefined, undefined, ...args);
	}
	catch {
		// 非 EDA 环境（单元测试等）下裸 eda 未注入，降级为本地替换。
		translated = undefined;
	}

	/*
	 * text() 只负责查表翻译，不负责插值（见文件头第 3 点）。
	 * 故这里对「译文」再做一次占位符替换；查不到词条时 translated === key，
	 * 替换同样生效，界面上不会残留 {0}。
	 */
	return format(translated ?? key, args);
}
