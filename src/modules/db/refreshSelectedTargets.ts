/**
 * The flow keeps the programs a user picked in localStorage as full snapshots. Without a refresh, a user who picked
 * programs before a data update keeps seeing the old thresholds and conditions forever. This re-reads every selected
 * program by id from the current catalog.
 *
 * - A program found in the catalog is replaced by its current version (thresholds, routes, notOffered…).
 * - A program missing from the catalog keeps its stored snapshot — it is never dropped silently.
 * - While the catalog hasn't loaded (empty), the stored list is returned as-is (same reference), so nothing re-renders.
 */
interface CatalogProgram {
	id: string;
}
interface CatalogInstitution<P extends CatalogProgram> {
	id: string;
	name: string;
	programs: P[];
}
interface SelectedTarget<P extends CatalogProgram> {
	institutionId: string;
	institutionName: string;
	program: P;
}

export function refreshSelectedTargets<P extends CatalogProgram, T extends SelectedTarget<P>>(
	stored: T[],
	catalog: CatalogInstitution<P>[]
): T[] {
	if (stored.length === 0 || catalog.length === 0) return stored;

	const current = new Map<string, { institution: CatalogInstitution<P>; program: P }>();
	for (const institution of catalog) {
		for (const program of institution.programs ?? []) current.set(program.id, { institution, program });
	}

	let changed = false;
	const refreshed = stored.map((target) => {
		const found = current.get(target.program.id);
		if (!found || found.program === target.program) return target;
		changed = true;
		return { ...target, institutionId: found.institution.id, institutionName: found.institution.name, program: found.program };
	});
	return changed ? refreshed : stored;
}
