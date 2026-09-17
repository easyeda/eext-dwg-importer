#!/usr/bin/env node
/**
 * 协议自检：
 * - extension.json / package.json 的 license 字段应为 GPL-3.0-or-later
 *   （本扩展分发 @mlightcad/libredwg-web 的 wasm，该库为 GPL-3.0）
 * - 若已同步 vendor/libredwg-web，校验三件套齐全
 *
 * 用法：`npm run check:license`
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const EXPECTED = 'GPL-3.0-or-later';
const LICENSE_HEAD = 'GNU GENERAL PUBLIC LICENSE';
const LICENSE_VERSION_MARK = 'Version 3, 29 June 2007';

let failed = 0;
let warned = 0;

function fail(msg) {
	console.error(`[check-license] FAIL: ${msg}`);
	failed += 1;
}

function pass(msg) {
	console.log(`[check-license] OK:   ${msg}`);
}

function warn(msg) {
	console.warn(`[check-license] WARN: ${msg}`);
	warned += 1;
}

// 1. LICENSE 文件存在且是 GPLv3 文本
const licensePath = join(ROOT, 'LICENSE');
if (!existsSync(licensePath)) {
	fail('LICENSE not found');
}
else {
	const text = readFileSync(licensePath, 'utf-8');
	const head = text.trimStart().slice(0, 200);
	if (!head.startsWith(LICENSE_HEAD)) {
		fail(`LICENSE header unexpected: ${head.slice(0, 80)}`);
	}
	else if (!text.includes(LICENSE_VERSION_MARK)) {
		fail('LICENSE is GPL but not version 3 (libredwg-web is GPL-3.0)');
	}
	else {
		pass('LICENSE is GNU GPLv3');
	}
}

// 2. package.json license（pro-api-sdk 脚手架，缺失时仅告警）
const pkgPath = join(ROOT, 'package.json');
if (!existsSync(pkgPath)) {
	fail('package.json not found');
}
else {
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
	if (pkg.license !== EXPECTED) {
		warn(`package.json.license="${pkg.license}" (scaffold file, not enforced)`);
	}
	else {
		pass('package.json.license');
	}
}

// 3. extension.json license（权威声明，必须匹配）
const extPath = join(ROOT, 'extension.json');
if (!existsSync(extPath)) {
	fail('extension.json not found');
}
else {
	const ext = JSON.parse(readFileSync(extPath, 'utf-8'));
	if (ext.license !== EXPECTED) {
		fail(`extension.json.license="${ext.license}" (expected ${EXPECTED})`);
	}
	else {
		pass('extension.json.license');
	}
}

/*
 * 4. vendor/libredwg-web 产物齐全（未同步则告警）。
 *
 * 注意：sync-vendor.mjs 会把上游的「包装层 + wasm 胶水层」合并成**单个自包含 ESM**，
 * 因为运行时经 blob URL 加载，相对 import 无法解析（详见该脚本头部说明）。
 * 故这里校验的是合并后的两件套，而不是上游原始的 dist/ + wasm/ 三件套。
 */
const VENDOR = join(ROOT, 'vendor', 'libredwg-web');
const VENDOR_FILES = [
	'libredwg-web.js',
	'libredwg-web.wasm',
];
if (!existsSync(VENDOR)) {
	warn('vendor/libredwg-web not found (run `npm run sync:vendor`)');
}
else {
	const missing = VENDOR_FILES.filter(f => !existsSync(join(VENDOR, f)));
	if (missing.length > 0) {
		fail(`vendor/libredwg-web incomplete, missing: ${missing.join(', ')}`);
	}
	else {
		pass('vendor/libredwg-web (bundled esm + wasm) complete');
	}
}

if (failed > 0) {
	console.error(`[check-license] ${failed} check(s) failed`);
	process.exit(1);
}
console.log(`[check-license] all checks passed${warned > 0 ? ` (${warned} warning(s))` : ''}`);
