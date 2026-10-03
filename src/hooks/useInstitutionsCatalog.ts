'use client';

import { useEffect, useState } from 'react';
import type { AcademicInstitution } from '../types/academic';

/**
 * The full program catalog (~1.9MB raw JSON) is served by GET /api/institutions instead of being
 * bundled into client JS. One fetch per page load is shared by every component that needs it.
 * If the API is unreachable, the static JSON is loaded as a lazy chunk (downloaded only then).
 */
let catalogPromise: Promise<{ institutions: AcademicInstitution[]; fromDb: boolean }> | null = null;

async function fetchCatalog(): Promise<{ institutions: AcademicInstitution[]; fromDb: boolean }> {
	try {
		const res = await fetch('/api/institutions');
		const contentType = res.headers.get('content-type') || '';
		if (res.ok && contentType.includes('application/json')) {
			const data = await res.json();
			if (data?.success && Array.isArray(data.institutions) && data.institutions.length > 0) {
				return { institutions: data.institutions, fromDb: true };
			}
		}
	} catch (err) {
		console.warn('[useInstitutionsCatalog] API unavailable, falling back to static catalog:', err);
	}
	const { academicInstitutions } = await import('../data/academicData');
	return { institutions: academicInstitutions, fromDb: false };
}

export function loadInstitutionsCatalog() {
	if (!catalogPromise) {
		catalogPromise = fetchCatalog().catch((err) => {
			catalogPromise = null; // allow a retry on the next mount
			throw err;
		});
	}
	return catalogPromise;
}

export function useInstitutionsCatalog() {
	const [state, setState] = useState<{
		institutions: AcademicInstitution[];
		isLoading: boolean;
		isLoadedFromDb: boolean;
	}>({ institutions: [], isLoading: true, isLoadedFromDb: false });

	useEffect(() => {
		let isMounted = true;
		loadInstitutionsCatalog()
			.then(({ institutions, fromDb }) => {
				if (isMounted) setState({ institutions, isLoading: false, isLoadedFromDb: fromDb });
			})
			.catch(() => {
				if (isMounted) setState({ institutions: [], isLoading: false, isLoadedFromDb: false });
			});
		return () => {
			isMounted = false;
		};
	}, []);

	return state;
}
