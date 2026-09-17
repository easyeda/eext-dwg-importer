/**
 * 扩展包内运行时资源的解析。
 *
 * 背景（这是本扩展最容易踩的坑）：
 * - EDA 渲染弹窗时，会把 HTML/CSS 中形如 `src|href="/xxx"` 的**包内绝对路径**
 *   取文件内容后替换为 blob URL（ui.js 的 changeLabelAddress）。
 * - 但 JS 内部的 `import()` / `fetch()` **不会**被这样处理；
 *   而弹窗页面本身由 blob URL 承载，`import.meta.url` 形如
 *   `blob:https://.../uuid`，据此做相对路径解析会直接抛 `Invalid URL`。
 *
 * 因此方案是：在 index.html 里用 `<link rel="preload">` 登记这些资源，
 * 让 EDA 完成 blob URL 改写；运行时（本模块）从 DOM 取回改写后的 URL 使用。
 *
 * 对应的 HTML 元素 id 见 index.html，勿随意改名；
 * build/iframe.ts 的 assertVendorLinks() 会在构建期校验其存在。
 */

const SQL = {
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

/** libredwg ESM 包装模块的 URL。 */
export function vendorModuleUrl(): string {
	return resourceUrl(SQL.module);
}

/**
 * wasm 所在的“目录”URL。
 *
 * 上游 `LibreDwg.create(filepath)` 内部会拼成 `${filepath}/${filename}`
 * （见 @mlightcad/libredwg-web 的 create 实现），因此这里需要传入
 * **去掉文件名后的前缀**，再交给它拼上 `libredwg-web.wasm`。
 */
export function vendorWasmDir(): string {
	const url = resourceUrl(SQL.wasm);
	const idx = url.lastIndexOf('/');
	if (idx < 0)
		throw new Error(`wasm 资源 URL 异常，无法解析目录：${url}`);
	return url.slice(0, idx);
}
