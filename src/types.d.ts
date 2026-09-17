/**
 * 环境声明：esbuild 以 `loader: { '.css': 'text' }` 处理 CSS，
 * 因此导入结果是字符串（而非副作用模块）。
 */
declare module '*.css' {
	const content: string;
	export default content;
}
