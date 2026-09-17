/*
 * 备用构建脚本：在 esbuild 的 JS API 不可用时完成 iframe 产物组装。
 *
 * 背景
 * ----
 * 正常构建走 `npm run build`（config/esbuild.prod.ts + build/iframe.ts）。
 * 但 build/iframe.ts 内部调用 esbuild 的 **JS API**，该 API 需要以管道 stdio
 * 与 esbuild 服务进程通信；在某些受限环境下（Windows 沙箱、部分企业策略）
 * 这会直接 `spawn EPERM`，导致构建完全无法进行。
 * esbuild 的 **CLI** 不依赖该管道，仍可正常工作。
 *
 * 因此本脚本把构建拆成两步：
 *   1. 由调用方用 esbuild CLI 生成 dist/index.js 与 dist/iframe/index.js；
 *   2. 执行本脚本，完成 build/iframe.ts 中的纯文件系统步骤
 *      （拷贝 HTML、拷贝 vendor、以及三项一致性校验）。
 *
 * 用法
 * ----
 *   npm run build:fallback
 * 该 npm script 已串好 esbuild CLI 调用。
 *
 * 一致性
 * ------
 * 三项校验与 build/iframe.ts 中的实现保持同义。若修改了校验规则，
 * 请同步两处 —— 权威实现仍是 build/iframe.ts。
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DIST_IFRAME = path.join(DIST, 'iframe');
const DIST_VENDOR = path.join(DIST, 'vendor', 'libredwg-web');
const VENDOR_LIBREDWG = path.join(ROOT, 'vendor', 'libredwg-web');
const htmlSrc = path.join(ROOT, 'src', 'iframe', 'index.html');

/** 去掉 HTML 注释：注释里出现的示例路径不应参与校验。 */
const stripComments = s => s.replace(/<!--[\s\S]*?-->/g, '');

fs.ensureDirSync(DIST_IFRAME);
await fs.copyFile(htmlSrc, path.join(DIST_IFRAME, 'index.html'));
console.log('[fallback] html copied');

if (await fs.pathExists(VENDOR_LIBREDWG)) {
	await fs.ensureDir(DIST_VENDOR);
	await fs.copy(VENDOR_LIBREDWG, DIST_VENDOR, { overwrite: true });
	console.log('[fallback] vendor copied → dist/vendor/libredwg-web/');
}
else {
	console.warn('[fallback] vendor/libredwg-web not found — 请先执行 npm run sync:vendor');
}

const html = await fs.readFile(htmlSrc, 'utf8');
const htmlNoComments = stripComments(html);

// ── 校验 1：HTML 中的绝对路径必须指向真实产物 ────────────────────────
// 对应「路径写错 → openIFrame 静默返回 false → 点菜单毫无反应」这类问题。
let pathCount = 0;
for (const m of htmlNoComments.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
	const p = m[1];
	// vendor 资源由 EDA 改写为 blob URL，仓库内路径无需存在。
	if (p.startsWith('/dist/vendor/'))
		continue;
	// 绝对路径以「扩展包根目录」为基准（见 src/internal/import-dwg.ts 顶部说明）。
	if (!await fs.pathExists(path.join(ROOT, p.replace(/^\//, ''))))
		throw new Error(`[assertHtmlPaths] HTML 引用了不存在的产物：${p}`);
	pathCount++;
}
console.log(`[fallback] assertHtmlPaths OK（${pathCount} 个绝对路径）`);

// ── 校验 2：TS 中引用的 data-role 必须在 HTML 里定义 ────────────────
// 对应「HTML 漏写 data-role → need() 抛错 → 弹窗初始化中断」这类问题。
const defined = new Set([...htmlNoComments.matchAll(/data-role="([^"]+)"/g)].map(m => m[1]));

const tsFiles = [];
async function walk(dir) {
	for (const e of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, e.name);
		if (e.isDirectory())
			await walk(full);
		else if (e.name.endsWith('.ts'))
			tsFiles.push(full);
	}
}
await walk(path.join(ROOT, 'src'));

const used = new Set();
for (const f of tsFiles) {
	const src = await fs.readFile(f, 'utf8');
	// 匹配 need(root, 'role') / need<HTMLInputElement>(root, 'role')。
	// [^,\n] 而非 [^,]：限定在同一行内，避免跨行匹配到无关的逗号。
	for (const m of src.matchAll(/need(?:<[^>\n]*>)?\([^,\n]+,\s*['"]([^'"\n]+)['"]/g))
		used.add(m[1]);
}
// 含 $ 的是模板拼接（如 `[data-role="${role}"]`），不是字面量，跳过。
const missing = [...used].filter(r => !r.includes('$') && !defined.has(r));
if (missing.length > 0)
	throw new Error(`[assertDataRoles] HTML 缺少 data-role：${missing.join(', ')}`);
console.log(`[fallback] assertDataRoles OK（引用 ${used.size} 个 role，HTML 定义 ${defined.size} 个）`);

// ── 校验 3：vendor 资源已登记、文件就位、引擎无相对 import ──────────
// 弹窗由 blob URL 承载，相对 import 无法解析（曾导致「解析失败」）。
const links = [...htmlNoComments.matchAll(/<link[^>]*id="(vendor-[^"]+)"[^>]*href="([^"]+)"/g)];
if (links.length === 0)
	throw new Error('[assertVendorLinks] HTML 未登记任何 vendor 资源');

for (const [, id, href] of links) {
	if (!await fs.pathExists(path.join(ROOT, href.replace(/^\//, ''))))
		throw new Error(`[assertVendorLinks] ${id} 指向的文件不存在：${href}`);
	console.log(`[fallback] assertVendorLinks ${id} → ${href} OK`);
}

const engineJs = path.join(DIST_VENDOR, 'libredwg-web.js');
if (await fs.pathExists(engineJs)) {
	const js = await fs.readFile(engineJs, 'utf8');
	const rel = js.match(/from\s*["'][^"']*\.\.?\/[^"']*["']/g);
	if (rel)
		throw new Error(`[assertVendorLinks] 引擎 JS 残留相对 import：${rel.join(', ')}`);
	console.log('[fallback] assertVendorLinks 引擎 JS 无相对 import OK');
}

process.exit(0);
