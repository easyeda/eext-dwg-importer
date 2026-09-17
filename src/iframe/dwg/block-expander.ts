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
	const m = new Map<string, DwgEntity[]>();
	for (const b of rawBlocks) {
		m.set(b.name, b.entities.map(rawToEntity));
	}
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
