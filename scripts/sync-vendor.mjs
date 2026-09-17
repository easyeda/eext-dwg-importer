#!/usr/bin/env node
/**
 * 同步 vendor/libredwg-web/：从 node_modules/@mlightcad/libredwg-web 拷贝运行时三件套。
 *
 * 上游包结构（必须保持相对布局，因为它内部用
 * `new URL("libredwg-web.wasm", import.meta.url)` 定位 wasm）：
 *
 *   dist/libredwg-web.js        → ESM 包装（parser.ts 的 import 目标）
 *   wasm/libredwg-web.js        → wasm 胶水层（被 dist 以 ../wasm/ 引用）
 *   wasm/libredwg-web.wasm      → 真正的 wasm 二进制（约 9.5 MB）
 *
 * 因此这里按 dist/ 与 wasm/ 两个子目录镜像拷贝，不能只拷单个文件。
 *
 * 用法：`npm run sync:vendor`
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'node_modules', '@mlightcad', 'libredwg-web');
const DST = join(ROOT, 'vendor', 'libredwg-web');

/** [源相对路径, 目标相对路径] */
const FILES = [
	['dist/libredwg-web.js', 'dist/libredwg-web.js'],
	['wasm/libredwg-web.js', 'wasm/libredwg-web.js'],
	['wasm/libredwg-web.wasm', 'wasm/libredwg-web.wasm'],
];

function main() {
	if (!existsSync(SRC)) {
		console.error(`[sync] Source not found: ${SRC}`);
		console.error('[sync] Run `npm install @mlightcad/libredwg-web` first.');
		process.exit(1);
	}

	let copied = 0;
	for (const [relSrc, relDst] of FILES) {
		const src = join(SRC, relSrc);
		const dst = join(DST, relDst);
		if (!existsSync(src)) {
			console.error(`[sync] Missing upstream file: ${src}`);
			process.exit(1);
		}
		mkdirSync(dirname(dst), { recursive: true });
		copyFileSync(src, dst);
		console.log(`[sync] ${relDst}`);
		copied += 1;
	}
	console.log(`[sync] OK (${copied} files) → vendor/libredwg-web/`);
}

main();
