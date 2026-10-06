/**
 * Mechina (pre-academic program) and Open University transfer-track ("אפיק מעבר") pages per university.
 * Offered only when even psychometric 800 with 6 bagrut exams doesn't reach a program's threshold.
 *
 * Checked 2026-10-06:
 * - Open University: www.openu.ac.il/transfertrack/pages/default.aspx lists transfer tracks to TAU, HUJI, Technion,
 *   Bar-Ilan, Haifa and BGU (a made-up university path returns 404, so these pages exist). None to Ariel or Reichman.
 * - Mechina: Bar-Ilan and BGU pages verified by their content; Technion, HUJI, Haifa and Ariel are on the university's
 *   own domain but block automated clients (WAF), so only the address was checked. No verified page for TAU or Reichman.
 * Programs, conditions and grades are deliberately not listed here — the pages are the source.
 */
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
