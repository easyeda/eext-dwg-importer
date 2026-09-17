/**
 * iframe 构建脚本：
 * 1. esbuild 打包 src/iframe/index → dist/iframe/index.js
 * 2. 拷贝 src/iframe/index.html → dist/iframe/index.html
 * 3. 拷贝 vendor/libredwg-web/* → dist/vendor/libredwg-web/（若存在）
 *
 * 注意：vendor 保持 dist/ 与 wasm/ 两层结构，因为上游以
 * `new URL("libredwg-web.wasm", import.meta.url)` 相对定位 wasm。
 */

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import fs from 'fs-extra';

import iframeConfig from '../config/esbuild.iframe.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const DIST_IFRAME = path.join(ROOT, 'dist', 'iframe');
const VENDOR_LIBREDWG = path.join(ROOT, 'vendor', 'libredwg-web');
const DIST_VENDOR = path.join(ROOT, 'dist', 'vendor', 'libredwg-web');

async function main(): Promise<void> {
	fs.ensureDirSync(DIST_IFRAME);

	// 1. esbuild build
	await esbuild.build(iframeConfig);
	console.log('[iframe] esbuild OK');

	// 2. 拷贝 index.html（保持 .js 引用路径相对）
	const htmlSrc = path.join(ROOT, 'src', 'iframe', 'index.html');
	const htmlDst = path.join(DIST_IFRAME, 'index.html');
	await fs.copyFile(htmlSrc, htmlDst);
	console.log('[iframe] html copied');

	// 3. 拷贝 vendor/libredwg-web（若存在）
	if (await fs.pathExists(VENDOR_LIBREDWG)) {
		await fs.ensureDir(DIST_VENDOR);
		await fs.copy(VENDOR_LIBREDWG, DIST_VENDOR, { overwrite: true });
		console.log('[iframe] vendor copied → dist/vendor/libredwg-web/');
	}
	else {
		console.warn('[iframe] vendor/libredwg-web not found — run `npm run sync:vendor` for real DWG parsing');
	}
}

main().catch((err) => {
	console.error('[iframe] build failed:', err);
	process.exit(1);
});
