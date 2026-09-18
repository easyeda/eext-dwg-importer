/**
 * 文件选择 / 拖拽 / 解析进度 section。
 *
 * 拖拽区在本 section 内（左栏）；文件名与解析状态显示在右栏顶部的
 * 文件状态条（file-status-section），由调用方把两个标签节点传入——
 * 两块 UI 分属不同卡片，DOM 上不是父子关系，无法用 need(root) 就近查找。
 */

import { t } from '../../shared/i18n';
import { need } from './dom';

/** 文件状态条的标签节点（位于右栏顶部，由 index.ts 从 main 范围查找）。 */
export interface FileSectionLabels {
	name: HTMLElement;
	status: HTMLElement;
	/** 全部图元的整体 bbox 尺寸行（解析成功后显示，用于判断导入单位）。 */
	size: HTMLElement;
}

export interface FileSection {
	setStatusIdle: () => void;
	setStatusParsing: (percent: number) => void;
	/**
	 * @param unitLabel 已解析出的图纸单位（显示出来便于核对换算是否正确）。
	 * @param size 全部图元的整体包围盒（图纸原始单位）——用户据此判断该用
	 *   哪个单位导入（如 297×210 大概率是 mm 的 A4 图框）。
	 */
	setStatusParsed: (
		entityCount: number,
		layerCount: number,
		unitLabel: string,
		size: { width: number; height: number },
	) => void;
	setStatusError: (message: string) => void;
	onFileSelected: (cb: (file: File) => void) => void;
	destroy: () => void;
}

/**
 * @param root 挂载节点（file-section 容器，仅含拖拽区与隐藏的 file input）。
 * @param labels 右栏顶部状态条的「文件名」「状态」节点。
 * @param onSelect 选中新文件时先于 onFileSelected 回调触发（可选）。
 *   原用于重置预览区；预览区移除后目前无调用方传参，保留是为了语义完整。
 */
export function createFileSection(
	root: HTMLElement,
	labels: FileSectionLabels,
	onSelect?: () => void,
): FileSection {
	const drop = need(root, 'dropzone') as HTMLDivElement;
	const fileInput = need(root, 'file-input') as HTMLInputElement;
	const nameLabel = labels.name;
	const statusLabel = labels.status;
	const sizeLabel = labels.size;

	/** 尺寸数字：最多两位小数并去掉尾随零（297.00 → 297，210.56 → 210.56）。 */
	const fmtNum = (n: number): string => Number(n.toFixed(2)).toString();

	// 拖拽区本身即点击入口（不再单独放「选择文件」按钮）。
	drop.textContent = t('Drop DWG file here or click to select');

	const handlers: Array<(file: File) => void> = [];

	drop.addEventListener('click', () => fileInput.click());

	drop.addEventListener('dragover', (ev) => {
		ev.preventDefault();
		drop.classList.add('is-dragover');
	});
	drop.addEventListener('dragleave', () => drop.classList.remove('is-dragover'));
	drop.addEventListener('drop', (ev) => {
		ev.preventDefault();
		drop.classList.remove('is-dragover');
		const file = ev.dataTransfer?.files?.[0];
		if (file)
			emitFile(file);
	});

	fileInput.addEventListener('change', () => {
		const file = fileInput.files?.[0];
		if (file)
			emitFile(file);
		fileInput.value = '';
	});

	function emitFile(file: File): void {
		const name = file.name;
		const sizeKb = (file.size / 1024).toFixed(1);
		nameLabel.textContent = `${name} · ${sizeKb} KB`;
		onSelect?.();
		for (const h of handlers) h(file);
	}

	const section: FileSection = {
		setStatusIdle() {
			statusLabel.textContent = t('Status: idle');
			sizeLabel.textContent = '';
		},
		setStatusParsing(percent: number) {
			statusLabel.textContent = t('Status: parsing {0}%', String(percent));
			sizeLabel.textContent = '';
		},
		setStatusParsed(entityCount: number, layerCount: number, unitLabel: string, size: { width: number; height: number }) {
			statusLabel.textContent = t(
				'Status: parsed, {0} primitives, {1} layers, unit {2}',
				String(entityCount),
				String(layerCount),
				unitLabel,
			);
			// 整体 bbox 用图纸原始单位显示：数值的量级本身就是选单位的依据
			// （如 297×210 → mm 图框；11.7×8.3 → inch；×1000 量级 → 单位声明缺失）。
			sizeLabel.textContent = t(
				'Extents: {0} × {1} (drawing units)',
				fmtNum(size.width),
				fmtNum(size.height),
			);
		},
		setStatusError(message: string) {
			statusLabel.textContent = t('Status: parse failed: {0}', message);
			sizeLabel.textContent = '';
		},
		onFileSelected(cb) {
			handlers.push(cb);
		},
		destroy() {
			handlers.length = 0;
		},
	};

	return section;
}
