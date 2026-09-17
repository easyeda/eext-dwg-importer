#!/usr/bin/env node
/**
 * 同步并打包 vendor/libredwg-web/。
 *
 * 背景（这是本扩展踩过的坑，务必看完再改）：
 *
 * 上游 @mlightcad/libredwg-web 的运行时由三个文件构成，且彼此以**相对路径**引用：
 *
 *   dist/libredwg-web.js    ── import "../wasm/libredwg-web.js" ──┐
 *   wasm/libredwg-web.js    ← 胶水层，默认导出 createModule       │
 *   wasm/libredwg-web.wasm  ← 真正的 wasm 二进制（约 9.5 MB）      │
 *
 * 而 EDA 的弹窗由 blob URL 承载，资源只能通过 HTML 里登记的绝对路径
 * 由 EDA 改写成 blob URL 后使用。blob: 协议**不支持相对路径解析**，
 * 因此包装层里的 `import "../wasm/libredwg-web.js"` 会直接失败：
 *
 *   Failed to resolve module specifier "../wasm/libredwg-web.js".
 *   Invalid relative url or base scheme isn't hierarchical.
 *
 * 解决方案：构建期把「包装层 + 胶水层」合并为**单个自包含 ESM 文件**，
 * 消除所有相对 import；wasm 二进制仍在运行时通过 locateFile 指定
 * （由 HTML 登记后取回 blob URL）。
 *
 * 产物：
 *   vendor/libredwg-web/libredwg-web.js    合并后的自包含 ESM
 *   vendor/libredwg-web/libredwg-web.wasm  wasm 二进制
 *
 * 用法：`npm run sync:vendor`
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'node_modules', '@mlightcad', 'libredwg-web');
const DST = join(ROOT, 'vendor', 'libredwg-web');

const GLUE = join(SRC, 'wasm', 'libredwg-web.js'); // 胶水层（export default createModule）
const WRAPPER = join(SRC, 'dist', 'libredwg-web.js'); // 包装层（含 LibreDwg 等类型与 convert）
const WASM = join(SRC, 'wasm', 'libredwg-web.wasm');

function main() {
	for (const [label, p] of [['glue', GLUE], ['wrapper', WRAPPER], ['wasm', WASM]]) {
		if (!existsSync(p)) {
			console.error(`[sync] 缺少上游文件（${label}）：${p}`);
			console.error('[sync] 请先执行 `npm install @mlightcad/libredwg-web`。');
			process.exit(1);
		}
	}

	const glueSrc = readFileSync(GLUE, 'utf-8');
	const wrapperSrc = readFileSync(WRAPPER, 'utf-8');

	// ① 胶水层本身就是 `async function createModule(...) {...}` 加一行 `export default`，
	//    无顶层 await，故只需去掉 export 语句，其函数声明即可与包装层共享作用域。
	const glueInlined = glueSrc
		.replace(/export\s+default\s+createModule\s*;?/, '')
		.replace(/^\s*export\s+\{[^}]*\}\s*(?:;\s*)?$/gm, '');

	if (/\bexport\b/.test(glueInlined.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) {
		console.error('[sync] 胶水层去除 export 后仍含 export 关键字，合并可能失败，请检查上游是否改动。');
		process.exit(1);
	}

	// ② 包装层以两种方式引用胶水层的默认导出：
	//      import createModule from "../wasm/libredwg-web.js";             → 局部名 createModule
	//      import { default as default2 } from "../wasm/libredwg-web.js";  → 局部名 default2
	//    其导出表里含 `default2 as createModule`，故两者都要有对应绑定。
	//
	//    处理方式：
	//      - 第一行直接删除：胶水层合并后本就有同名的 createModule 函数声明，
	//        若再写 `const createModule = ...` 会「Identifier already declared」。
	//      - 第二行改写为别名，指向同一个函数。
	const wrapperClean = wrapperSrc
		.replace(
			/^\s*import\s+createModule\s+from\s+['"][^'"]*wasm\/libredwg-web\.js['"];?\s*$/gm,
			'',
		)
		.replace(
			/^\s*import\s*\{\s*default\s+as\s+default2\s*\}\s*from\s+['"][^'"]*wasm\/libredwg-web\.js['"];?\s*$/gm,
			'const default2 = __dwgGlueDefault;',
		);

	if (wrapperClean.includes('wasm/libredwg-web.js')) {
		console.error('[sync] 包装层中仍存在对胶水层的引用，合并会失败。请检查上游是否改动。');
		process.exit(1);
	}

	// ③ 拼接顺序：先胶水层（声明 createModule），再包装层（使用它）
	const banner = `/*\n`
		+ ` * 本文件由 scripts/sync-vendor.mjs 自动生成，请勿手动修改。\n`
		+ ` *\n`
		+ ` * 内容 = @mlightcad/libredwg-web 的「wasm 胶水层」+「ESM 包装层」合并而成。\n`
		+ ` * 合并原因：上游包装层以相对路径 import 胶水层，而 EDA 弹窗是 blob URL，\n`
		+ ` * 不支持相对解析（详见该脚本顶部说明）。合并后本文件无任何相对 import，\n`
		+ ` * wasm 二进制在运行时通过 locateFile 指定。\n`
		+ ` *\n`
		+ ` * 许可：上游为 GPL-3.0，本扩展整体以 GPL-3.0-or-later 分发。\n`
		+ ` */\n`;

	const merged = `${banner}\n`
		+ `// ===== begin: wasm 胶水层 =====\n`
		+ `${glueInlined}\n`
		// 包装层原先的两处 import 均改为引用此别名（其值即 createModule）
		+ `const __dwgGlueDefault = createModule;\n`
		+ `// ===== end: wasm 胶水层 =====\n\n`
		+ `// ===== begin: ESM 包装层（已移除相对 import）=====\n`
		+ `${wrapperClean}\n`;

	mkdirSync(DST, { recursive: true });

	// 清理旧结构（此前按 dist/ + wasm/ 两目录拷贝）
	rmSync(join(DST, 'dist'), { recursive: true, force: true });
	rmSync(join(DST, 'wasm'), { recursive: true, force: true });

	writeFileSync(join(DST, 'libredwg-web.js'), merged, 'utf-8');
	writeFileSync(join(DST, 'libredwg-web.wasm'), readFileSync(WASM));

	console.log(`[sync] 合并完成 → vendor/libredwg-web/libredwg-web.js（${merged.length} 字节）`);
	console.log(`[sync] wasm 拷贝完成 → vendor/libredwg-web/libredwg-web.wasm`);
}

main();
