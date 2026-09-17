/**
 * iframe 入口的独立构建配置。
 *
 * 不与 pro-api-sdk 的 esbuild.common.ts 共用：SDK 的 IIFE/globalName 只适用于主入口。
 *
 * 产物：dist/iframe/index.js（ESM bundle）
 * index.html 由 build/iframe.ts 单独拷贝（保留对 ./index.js 的引用）。
 */

import type esbuild from 'esbuild';

export default {
	entryPoints: {
		index: './src/iframe/index',
	},
	entryNames: '[name]',
	bundle: true,
	minify: false,
	format: 'esm',
	platform: 'browser',
	target: 'es2020',
	outdir: './dist/iframe',
	sourcemap: false,
	treeShaking: true,
	loader: {
		// CSS 以 text 载入，随后在运行时注入（见 src/iframe/ui/inject-styles.ts）。
		'.css': 'text',
		'.wasm': 'file',
	},
	assetNames: '../assets/[name]-[hash]',
	define: {},
	// 上游 wasm 胶水层（wasm/libredwg-web.js）含 Node 专用的 `import("node:module")`，
	// 无法为浏览器打包。保持 external，由运行时从 vendor 目录动态 import。
	external: ['@mlightcad/libredwg-web'],
} satisfies Parameters<(typeof esbuild)['build']>[0];
