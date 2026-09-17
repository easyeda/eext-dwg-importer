/**
 * DOM 查询辅助。
 *
 * 为什么不用 `querySelector(...)!`：
 * 非空断言只在编译期有效。一旦 HTML 漏写属性，运行时得到 null，
 * 紧接着的属性访问会以「Cannot read properties of null」中断整个初始化，
 * 而弹窗仍显示静态骨架，看起来「打开了但不可用」，极难定位。
 *
 * 这里改为在缺失时抛出点明 data-role 的错误。
 * 另：build/iframe.ts 的 assertDataRoles() 会在构建期拦截此类遗漏。
 */

/** 按 data-role 查找元素；找不到时抛出带明确信息的错误。 */
export function need<T extends HTMLElement = HTMLElement>(root: ParentNode, role: string): T {
	const el = root.querySelector<T>(`[data-role="${role}"]`);
	if (!el) {
		throw new Error(`弹窗 HTML 缺少 data-role="${role}" 的元素`);
	}
	return el;
}
