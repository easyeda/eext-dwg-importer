/**
 * 共享 i18n 工具：基于 eda.sys_I18n.text 的薄包装。
 *
 * 用法：`t('Status: parsing {0}%', '42')`
 *
 * ⚠️ 两个关键点（均已对照 pro-api-types 与实机核实）：
 *
 * 1. `eda` 是 EDA 注入的**函数参数**（入口代码被包在 `async function (eda) {...}` 中），
 *    `globalThis.eda` 并不存在。故此处走 edaApi() 引用裸标识符。
 *
 * 2. SYS_I18n.text 的真实签名含 namespace / language 两个占位参数：
 *      text(tag: string, namespace?: string, language?: string, ...args: any[]): string
 *    因此插值参数必须放在第 4 个位置起，否则会被当成 namespace 而错位。
 *
 * iframe 内同样可访问 eda（官方文档确认），故本函数在主进程与 iframe 中通用。
 */

import type { EdaGlobals } from './eda-api';
import { edaApi } from './eda-api';

export type I18nArgs = ReadonlyArray<string | number>;

type I18nLike = Pick<EdaGlobals, 'sys_I18n'>;

export function t(key: string, ...args: I18nArgs): string {
	let i18n: I18nLike['sys_I18n'] | undefined;
	try {
		i18n = (edaApi() as I18nLike | undefined)?.sys_I18n;
	}
	catch {
		// 非 EDA 环境（单元测试等）下裸 eda 未注入，降级为占位符替换。
		i18n = undefined;
	}

	if (i18n?.text) {
		try {
			// namespace / language 传 undefined，插值参数从第 4 位开始。
			return i18n.text(key, undefined, undefined, ...args);
		}
		catch {
			// 落到下面的本地回退
		}
	}

	// 回退：把 ${1} / ${2} 占位符替换为 args[0] / args[1]。
	let s = key;
	args.forEach((arg, i) => {
		s = s.replaceAll(`\${${i + 1}}`, String(arg));
	});
	return s;
}
