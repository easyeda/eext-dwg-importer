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

	// 2. 拷贝 index.html
	const htmlSrc = path.join(ROOT, 'src', 'iframe', 'index.html');
	const htmlDst = path.join(DIST_IFRAME, 'index.html');
	await fs.copyFile(htmlSrc, htmlDst);
	console.log('[iframe] html copied');

	// 2b. 一致性校验：HTML 里的绝对路径必须指向产物真实位置。
	// 这一层校验是为了拦住「路径写错 → openIFrame 静默返回 false → 菜单点了没反应」这类问题，
	// 该问题在浏览器里没有任何报错，极难定位。
	await assertHtmlPaths(htmlSrc);

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

/**
 * 校验 HTML 中所有以 / 开头的绝对路径，在 dist/ 下确实存在。
 * 同时校验 import-dwg.ts 里的 IFRAME_HTML 与产物一致。
 */
async function assertHtmlPaths(htmlPath: string): Promise<void> {
	const html = await fs.readFile(htmlPath, 'utf-8');
	const refs = [...html.matchAll(/(?:src|href)\s*=\s*"(\/[^"]+)"/g)].map(m => m[1]!);
	if (refs.length === 0) {
		throw new Error('iframe/index.html 中没有任何绝对路径引用（应以 /dist/iframe/ 开头）');
	}
	for (const ref of refs) {
		// 包内绝对路径 → 仓库内实际文件
		const onDisk = path.join(ROOT, ref.replace(/^\//, ''));
		if (!(await fs.pathExists(onDisk))) {
			throw new Error(
				`iframe/index.html 引用了不存在的文件：${ref}\n`
				+ `  期望位于仓库内：${path.relative(ROOT, onDisk)}\n`
				+ '  提示：扩展包内路径以 .eext 根目录为基准，本扩展产物在 dist/ 下。',
			);
		}
	}

	// 校验 import-dwg.ts 的 IFRAME_HTML 与产物位置一致
	const importDwg = await fs.readFile(path.join(ROOT, 'src', 'internal', 'import-dwg.ts'), 'utf-8');
	const m = importDwg.match(/const IFRAME_HTML = '([^']+)'/);
	if (!m) {
		throw new Error('src/internal/import-dwg.ts 中未找到 IFRAME_HTML 常量');
	}
	const declared = m[1]!;
	const expected = `/${path.relative(ROOT, path.join(DIST_IFRAME, 'index.html')).replace(/\\/g, '/')}`;
	if (declared !== expected) {
		throw new Error(
			`IFRAME_HTML 与实际产物不一致：\n`
			+ `  import-dwg.ts 声明：${declared}\n`
			+ `  构建产物实际路径：${expected}`,
		);
	}

	console.log(`[iframe] path check OK (${declared}, ${refs.length} ref)`);
}

main().catch((err) => {
	console.error('[iframe] build failed:', err);
	process.exit(1);
});
