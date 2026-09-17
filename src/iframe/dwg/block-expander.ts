/**
 * BLOCK 展开：把 INSERT 替换为对应 BLOCK 内部的几何副本，
 * 应用 INSERT 的仿射变换（平移 + 缩放 + 旋转 + 镜像）。
 *
 * 变换公式（二维仿射）：p' = T + R(θ) · M(mirror) · S(s) · p
 */

import type {
	DwgEntity,
	DwgInsertEntity,
	DwgPoint,
	DwgPolylineEntity,
} from '../../shared/types';
import type { RawDwgEntity } from './ir';
import { rawToEntity, rawToInsert } from './ir';

export interface BlockDef {
	name: string;
	entities: DwgEntity[];
}

export function buildBlockDefs(rawBlocks: Array<{ name: string; entities: RawDwgEntity[] }>): Map<string, DwgEntity[]> {
	/*
	 * 块定义内部同样可能出现 INSERT（嵌套块 / 块引用块），
	 * 这是 DWG 的常规用法（例如「图框」块里引用「标题栏」块）。
	 *
	 * 因此这里必须递归展开，且要防两类问题：
	 * - 循环引用（A 引用 B，B 又引用 A）：用一个 visiting 集合截断；
	 * - 未定义的块名（跨文件 XREF）：跳过并计入 unresolved。
	 */
	const rawByName = new Map<string, RawDwgEntity[]>();
	for (const b of rawBlocks) {
		// 同名块以先出现的为准（BLOCK_RECORD 中不会重复，这里只是兜底）。
		if (!rawByName.has(b.name))
			rawByName.set(b.name, b.entities);
	}

	const resolved = new Map<string, DwgEntity[]>();
	const visiting = new Set<string>();

	/** 展开名为 name 的块定义；返回其内部实体（嵌套 INSERT 已就地展开）。 */
	function resolve(name: string): DwgEntity[] {
		const cached = resolved.get(name);
		if (cached)
			return cached;

		const raw = rawByName.get(name);
		if (!raw)
			return [];

		// 循环引用：返回空数组截断，而不是无限递归。
		if (visiting.has(name))
			return [];
		visiting.add(name);

		const out: DwgEntity[] = [];
		for (const e of raw) {
			if (e.kind !== 'INSERT') {
				out.push(rawToEntity(e));
				continue;
			}
			// 嵌套 INSERT：先取子块定义，再对其实体应用本层变换。
			const ins = rawToInsert(e);
			const child = resolve(ins.blockName);
			for (const c of child)
				out.push(transformEntity(c, ins));
		}

		visiting.delete(name);
		resolved.set(name, out);
		return out;
	}

	const m = new Map<string, DwgEntity[]>();
	for (const b of rawBlocks)
		m.set(b.name, resolve(b.name));

	return m;
}

export interface ExpandOptions {
	/** 跨文件 XREF 跳过行为：true = 跳过 + warning；false = 同样展开（基本不可能，因为没有 block 定义）。 */
	skipXref?: boolean;
}

export interface ExpandResult {
	entities: DwgEntity[];
	warnings: string[];
}

/** 对一组含 INSERT 的原始实体展开。 */
export function expandInserts(
	rawEntities: ReadonlyArray<RawDwgEntity>,
	blockDefs: ReadonlyMap<string, DwgEntity[]>,
	options: ExpandOptions = { skipXref: true },
): ExpandResult {
	const out: DwgEntity[] = [];
	const warnings: string[] = [];

	for (const raw of rawEntities) {
		if (raw.kind !== 'INSERT') {
			out.push(rawToEntity(raw));
			continue;
		}
		const ins = rawToInsert(raw);
		const def = blockDefs.get(ins.blockName);
		if (!def) {
			if (options.skipXref) {
				warnings.push(`XREF ${ins.blockName} not resolved (cross-file), skipped`);
			}
			continue;
		}
		for (const child of def) {
			out.push(transformEntity(child, ins));
		}
	}

	return { entities: out, warnings };
}

/** 对单个 DwgEntity 应用 INSERT 仿射变换。 */
export function transformEntity(entity: DwgEntity, ins: DwgInsertEntity): DwgEntity {
	const fromBlock = { blockName: ins.blockName, insertId: ins.id };
	switch (entity.kind) {
		case 'LINE':
			return {
				...entity,
				fromBlock,
				start: transformPoint(entity.start, ins),
				end: transformPoint(entity.end, ins),
			};
		case 'CIRCLE':
			return {
				...entity,
				fromBlock,
				center: transformPoint(entity.center, ins),
				radius: entity.radius * Math.sqrt(Math.abs(ins.sx * ins.sy)),
			};
		case 'ARC':
			return {
				...entity,
				fromBlock,
				center: transformPoint(entity.center, ins),
				radius: entity.radius * Math.sqrt(Math.abs(ins.sx * ins.sy)),
				startAngle: entity.startAngle + ins.rotation,
				endAngle: entity.endAngle + ins.rotation,
			};
		case 'LWPOLYLINE':
		case 'POLYLINE':
		case 'SPLINE':
			return {
				...entity,
				fromBlock,
				points: entity.points.map((p: DwgPoint) => transformPoint(p, ins)),
			} satisfies DwgPolylineEntity;
		case 'TEXT':
		case 'MTEXT':
			return {
				...entity,
				fromBlock,
				position: transformPoint(entity.position, ins),
				height: entity.height * Math.sqrt(Math.abs(ins.sx * ins.sy)),
				rotation: entity.rotation + ins.rotation,
			};
		default:
			/*
			 * 类型穷尽保护：switch 覆盖了 DwgEntity 的全部成员，正常不会走到这里。
			 * 但若上游新增类型而此处未同步，返回 undefined 会污染实体数组，
			 * 并在后续 computeBoundingBox 处才以「读 undefined 的 kind」暴露，
			 * 定位成本很高。故在此显式失败并带上类型名。
			 */
			throw new Error(`transformEntity: 未知实体类型 ${(entity as { kind?: string }).kind}`);
	}
}
function transformPoint(p: DwgPoint, ins: DwgInsertEntity): DwgPoint {
	const x = p.x * ins.sx;
	const y0 = p.y * ins.sy;
	const y = ins.mirror ? -y0 : y0;
	const c = Math.cos(ins.rotation);
	const s = Math.sin(ins.rotation);
	return {
		x: x * c - y * s + ins.tx,
		y: x * s + y * c + ins.ty,
	};
}
