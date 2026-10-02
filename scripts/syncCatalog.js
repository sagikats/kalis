/**
 * Syncs the academic CATALOG (institutions, programs, bagrut subjects) from the database built
 * into the image at deploy time (/app/prisma_seed/dev.db) into the live database on the volume.
 *
 * Runs on container start (see scripts/entrypoint.sh). It never touches user data
 * (users, profiles, preferences, saved tracks) and never deletes a program that a user saved —
 * programs removed from the catalog are only deleted when nothing references them.
 */

const { PrismaClient } = require('@prisma/client');

const SEED_URL = process.env.CATALOG_SEED_URL || 'file:/app/prisma_seed/dev.db';

async function main() {
	const seed = new PrismaClient({ datasources: { db: { url: SEED_URL } } });
	const live = process.env.CATALOG_LIVE_URL
		? new PrismaClient({ datasources: { db: { url: process.env.CATALOG_LIVE_URL } } })
		: new PrismaClient();

	try {
		const [institutions, programs, subjects] = await Promise.all([
			seed.institution.findMany(),
			seed.academicProgram.findMany(),
			seed.bagrutSubject.findMany()
		]);
		if (institutions.length === 0 || programs.length === 0) {
			console.log('[syncCatalog] Seed catalog is empty — skipping.');
			return;
		}

		const strip = ({ createdAt, updatedAt, ...rest }) => rest;
		let upserted = 0;

		await live.$transaction(async (tx) => {
			for (const inst of institutions) {
				const data = strip(inst);
				await tx.institution.upsert({ where: { id: inst.id }, create: data, update: data });
			}
			for (const prog of programs) {
				const data = strip(prog);
				await tx.academicProgram.upsert({ where: { id: prog.id }, create: data, update: data });
				upserted++;
			}
			for (const subj of subjects) {
				const data = strip(subj);
				await tx.bagrutSubject.upsert({ where: { id: subj.id }, create: data, update: data });
			}
		});

		// Remove programs that left the catalog, unless a user's saved track still points at them
		const seedIds = new Set(programs.map((p) => p.id));
		const liveIds = await live.academicProgram.findMany({ select: { id: true } });
		let removed = 0;
		let kept = 0;
		for (const { id } of liveIds) {
			if (seedIds.has(id)) continue;
			const refs = await live.savedTrack.count({ where: { programId: id } });
			if (refs === 0) {
				await live.academicProgram.delete({ where: { id } });
				removed++;
			} else {
				kept++;
			}
		}

		console.log(
			`[syncCatalog] ${institutions.length} institutions, ${upserted} programs, ${subjects.length} subjects synced` +
				(removed || kept ? `; ${removed} retired programs removed, ${kept} kept (referenced by saved tracks)` : '')
		);
	} finally {
		await seed.$disconnect();
		await live.$disconnect();
	}
}

main().catch((err) => {
	// Never block startup on a catalog sync failure — the previous catalog stays in place
	console.error('[syncCatalog] Failed, keeping existing catalog:', err);
	process.exitCode = 0;
});
