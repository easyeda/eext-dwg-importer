/**
 * 运行时样式注入。
 *
 * 构建时 CSS 以 `loader: { '.css': 'text' }` 变成字符串导入，
 * 因为 esbuild 的纯 CSS 导入在 treeShaking 下会被当作无副作用而丢弃。
 * 这里显式把它塞进 <style>，保证打包后样式生效。
 */

export function injectStyles(css: string): void {
	if (typeof document === 'undefined')
		return;
	if (document.querySelector('style[data-dwg-importer]'))
		return;
	const style = document.createElement('style');
	style.setAttribute('data-dwg-importer', '');
	style.textContent = css;
	document.head.appendChild(style);
}
