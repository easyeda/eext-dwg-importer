/**
 * 扩展包内运行时资源的解析。
 *
 * 背景（这是本扩展最容易踩的坑）：
 * - EDA 渲染弹窗时，会把 HTML/CSS 中形如 `src|href="/xxx"` 的**包内绝对路径**
 *   取文件内容后替换为 blob URL（ui.js 的 changeLabelAddress）。
 * - 但 JS 内部的 `import()` / `fetch()` **不会**被这样处理；
 *   而弹窗页面本身由 blob URL 承载，`import.meta.url` 形如
 *   `blob:https://.../uuid`，据此做相对路径解析会直接抛 `Invalid URL`。
 * - 更麻烦的是：blob: 协议下**连模块内部的相对 import 也无法解析**。
 *   上游 libredwg 的 ESM 包装层内部用 `import "../wasm/libredwg-web.js"`
 *   引用胶水层，故直接用上游产物会报：
 *     Failed to resolve module specifier "../wasm/libredwg-web.js".
 *     Invalid relative url or base scheme isn't hierarchical.
 *   因此 scripts/sync-vendor.mjs 会把「包装层 + 胶水层」合并为**单个自包含模块**，
 *   产物中不含任何相对 import。
 *
 * 方案：在 index.html 里用 `<link rel="preload">` 登记这些资源，
 * 让 EDA 完成 blob URL 改写；运行时（本模块）从 DOM 取回改写后的 URL 使用。
 *
 * 对应的 HTML 元素 id 见 index.html，勿随意改名；
 * build/iframe.ts 的 assertVendorLinks() 会在构建期校验。
 */

/** 资源元素 id，须与 index.html 保持一致。 */
const RESOURCE_ID = {
	module: 'vendor-libredwg',
	wasm: 'vendor-libredwg-wasm',
} as const;

/** 读取某个已登记资源的最终 URL（EDA 改写后应为 blob URL）。 */
function resourceUrl(id: string): string {
	const el = document.getElementById(id) as HTMLLinkElement | null;
	if (!el)
		throw new Error(`HTML 中缺少 id="${id}" 的资源声明`);
	const url = el.getAttribute('href') ?? '';
	if (!url)
		throw new Error(`资源 id="${id}" 的 href 为空`);
	return url;
}

/** 解析引擎模块（自包含 ESM）的 URL。 */
export function vendorModuleUrl(): string {
	return resourceUrl(RESOURCE_ID.module);
}

/**
 * wasm 二进制文件的完整 URL。
 *
 * 上游 `LibreDwg.create(filepath)` 内部会拼成 `${filepath}/${filename}`，
 * 但那是「目录 + 固定文件名」的形式；这里 wasm 已是**独立 blob URL**
 * （改写成 blob 后没有可用的目录概念），故不能走 create(filepath)，
 * 而是用 createModule 的 locateFile 钩子直接返回该 URL。
 * 见 parser.ts 的加载逻辑。
 */
export function vendorWasmUrl(): string {
	return resourceUrl(RESOURCE_ID.wasm);
}
