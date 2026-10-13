/**
 * Mechina (pre-academic program) and Open University transfer-track ("אפיק מעבר") pages per university.
 *
 * Open University — checked 2026-10-13 against www.openu.ac.il/transfertrack (snapshot:
 * src/data/sources/openu-transfer-tracks-2026-10-13.json):
 * - The index lists transfer tracks to TAU, HUJI, Technion, Bar-Ilan, Haifa and BGU only. Ariel and Reichman pages return 404.
 * - Tracks exist only for specific faculties/programs (Bar-Ilan: the Faculty of Law only), so the list is shown as-is
 *   and never matched to a program automatically.
 * - Since the CHE decision of 2022, guaranteed admission through a track also requires bagrut-certificate eligibility
 *   (not bagrut grades). No psychometric test. Many tracks require an English exemption.
 * Mechina — checked 2026-10-06: Bar-Ilan and BGU pages verified by their content; Technion, HUJI, Haifa and Ariel are on
 * the university's own domain but block automated clients (WAF), so only the address was checked. No verified page for
 * TAU or Reichman.
 * Programs, conditions and grades are deliberately not listed here — the linked official pages are the source.
 */
import openUniversitySnapshot from './sources/openu-transfer-tracks-2026-10-13.json';

export interface OpenUniversityTrack {
	name: string;
	url: string;
}

export const OPEN_UNIVERSITY_CHECKED_AT = '13.10.2026';
export const OPEN_UNIVERSITY_RULES_URL = 'https://www.openu.ac.il/transfertrack/pages/updates.aspx';

/** Transfer tracks from the Open University to each university, exactly as listed on the OU site. */
export const OPEN_UNIVERSITY_TRACKS: Record<string, OpenUniversityTrack[]> = openUniversitySnapshot.tracks;

export interface BypassRouteLinks {
	mechinaUrl?: string;
	openUniversityUrl?: string;
}

export const BYPASS_ROUTES: Record<string, BypassRouteLinks> = {
	technion: { mechinaUrl: 'https://kdam.technion.ac.il/', openUniversityUrl: 'https://www.openu.ac.il/transfertrack/technion/pages/default.aspx' },
	tau: { openUniversityUrl: 'https://www.openu.ac.il/transfertrack/tel-aviv/pages/default.aspx' },
	huji: { mechinaUrl: 'https://mechina.huji.ac.il/', openUniversityUrl: 'https://www.openu.ac.il/transfertrack/hebrew/pages/default.aspx' },
	bgu: { mechinaUrl: 'https://www.bgu.ac.il/welcome/kdam/', openUniversityUrl: 'https://www.openu.ac.il/transfertrack/ben-gurion/pages/default.aspx' },
	haifa: { mechinaUrl: 'https://mechina.haifa.ac.il/', openUniversityUrl: 'https://www.openu.ac.il/transfertrack/haifa/pages/default.aspx' },
	ariel: { mechinaUrl: 'https://www.ariel.ac.il/wp/mechina/' },
	bar_ilan: { mechinaUrl: 'https://mechina-kda.biu.ac.il/', openUniversityUrl: 'https://www.openu.ac.il/transfertrack/bar-ilan/pages/default.aspx' },
	reichman: {}
};
