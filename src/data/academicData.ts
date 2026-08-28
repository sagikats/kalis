import { AcademicInstitution, AcademicDegree } from '../types/academic';
import rawData from './academicData.json';

export const academicInstitutions: AcademicInstitution[] = rawData as AcademicInstitution[];

function normalizeInstitutionName(rawName: string): string {
     if (!rawName) return '';

     let name = rawName
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/["״'']/g, '"')
          .replace(/[–—]/g, '-');

     const lower = name.toLowerCase();

     if (lower.includes('תל') && lower.includes('אביב') && lower.includes('אוניברסיט')) {
          return 'אוניברסיטת תל אביב';
     }
     if (lower.includes('הפתוחה')) {
          return 'האוניברסיטה הפתוחה';
     }
     if (lower.includes('עברית')) {
          return 'האוניברסיטה העברית בירושלים';
     }
     if (lower.includes('בן גוריון') || lower.includes('בן-גוריון')) {
          return 'אוניברסיטת בן גוריון בנגב';
     }
     if (lower.includes('טכניון')) {
          return 'הטכניון - מכון טכנולוגי לישראל';
     }
     if (lower.includes('בר אילן') || lower.includes('בר-אילן')) {
          return 'אוניברסיטת בר אילן';
     }
     if (lower.includes('אריאל')) {
          return 'אוניברסיטת אריאל בשומרון';
     }
     if (lower.includes('חיפה') && (lower.includes('אוניברסיט') || lower.includes('אוניבסיט'))) {
          return 'אוניברסיטת חיפה';
     }
     if (lower.includes('תל חי') || lower.includes('תל-חי')) {
          return 'המכללה האקדמית תל חי';
     }
     if (lower.includes('תל אביב יפו') || lower.includes('תל-אביב יפו')) {
          return 'המכללה האקדמית תל אביב יפו';
     }
     if (lower.includes('הדסה')) {
          return 'המכללה האקדמית הדסה ירושלים';
     }
     if (lower.includes('עמק יזרעאל')) {
          return 'המכללה האקדמית עמק יזרעאל';
     }
     if (lower.includes('חולון') || lower.includes('hit')) {
          return 'HIT - המכון הטכנולוגי חולון';
     }
     if (lower.includes('משפט ועסקים') || lower.includes('משפט ולעסקים')) {
          return 'המרכז האקדמי למשפט ועסקים';
     }
     if (lower.includes('שנקר')) {
          return 'שנקר - הנדסה. עיצוב. אמנות';
     }
     if (lower.includes('אורנים')) {
          return 'המכללה האקדמית לחינוך אורנים';
     }
     if (lower.includes('בית ברל')) {
          return 'המכללה האקדמית בית ברל';
     }
     if (lower.includes('ספיר')) {
          return 'המכללה האקדמית ספיר';
     }
     if (lower.includes('אשקלון')) {
          return 'המכללה האקדמית אשקלון';
     }
     if (lower.includes('רופין')) {
          return 'המרכז האקדמי רופין';
     }
     if (lower.includes('בצלאל')) {
          return 'בצלאל אקדמיה לעיצוב ואומנות ירושלים';
     }
     if (lower.includes('אפקה')) {
          return 'אפקה - המכללה האקדמית להנדסה בתל אביב';
     }
     if (lower.includes('עזריאלי')) {
          return 'עזריאלי - המכללה האקדמית להנדסה ירושלים';
     }
     if (lower.includes('פרס')) {
          return 'המרכז האקדמי פרס';
     }
     if (lower.includes('סמי שמעון')) {
          return 'SCE - המכללה האקדמית להנדסה סמי שמעון';
     }
     if (lower.includes('בראודה')) {
          return 'המכללה האקדמית להנדסה אורט בראודה';
     }

     return name;
}

function isIsraeliInstitution(name: string): boolean {
     const lower = name.toLowerCase();
     const foreignKeywords = [
          'אירן', 'אוקראינה', 'הולנד', 'רוסיה', 'אוזבקיסטן', 'ברית המועצות', 'ארה"ב', 'ארה״ב',
          'בריטניה', 'גרוזיה', 'ארצות הברית', 'ברזיל', 'בלירוסיה', 'ברילנגטון', 'אנגליה', 'גרמניה',
          'ביר זית', 'אל-קודס', 'ג\'נין', 'ג"נין', 'אמריקראית', 'פוליטכנית בניו יורק'
     ];
     return !foreignKeywords.some(fk => lower.includes(fk));
}

/**
 * Fetch open data dynamically from data.gov.il API with fallback to pre-ingested dataset
 */
export async function fetchAcademicInstitutions(): Promise<AcademicInstitution[]> {
     try {
          const API_URL = 'https://data.gov.il/api/3/action/datastore_search?resource_id=9d656232-3329-4e41-bd6f-a793644b4ea6&limit=3000';
          const res = await fetch(API_URL, { cache: 'force-cache' });
          const json = await res.json();

          if (!json.success || !json.result || !json.result.records) {
               return academicInstitutions;
          }

          const rawRecords = json.result.records;
          const isFirstDegree = (rec: any) => {
               const level = (rec.Degree_level || '').trim();
               if (!level) return false;
               const isMasterOrDoc = /M\.Sc|M\.A|M\.B\.A|M\.Mus|M\.S\.W|M\.Ed|Ph\.D|תואר שני|תואר שלישי|מוסמך|דוקטור/i.test(level);
               if (isMasterOrDoc) return false;
               const prefixes = ['B.Sc', 'B.A', 'B.Sc.Agr', 'LL.B', 'B.Ed', 'B.Des', 'B.S.W', 'B.Mus', 'B.Tech', 'B.N', 'B.O.T', 'B.P.T', 'B.Med.Sc', 'תואר ראשון', 'בוגר'];
               return prefixes.some(p => level.toLowerCase().includes(p.toLowerCase())) || level.includes('ראשון');
          };

          const filtered = rawRecords.filter(isFirstDegree);
          const map = new Map<string, { id: string; name: string; programsMap: Map<string, AcademicDegree> }>();

          filtered.forEach((rec: any) => {
               const rawInstName = (rec.institution_name || '').trim();
               const instName = normalizeInstitutionName(rawInstName);
               const fieldName = (rec.Field_of_Education || rec.Placement_recommendations || '').trim().replace(/\s+/g, ' ');
               const degreeLevel = (rec.Degree_level || 'תואר ראשון').trim();
               const description = (rec.Explanations || rec.Faculty_Name || '').trim();

               if (!instName || !fieldName || !isIsraeliInstitution(instName)) return;

               if (!map.has(instName)) {
                    map.set(instName, {
                         id: `inst-${map.size + 1}`,
                         name: instName,
                         programsMap: new Map()
                    });
               }

               const inst = map.get(instName)!;
               const progKey = fieldName.toLowerCase();
               if (!inst.programsMap.has(progKey)) {
                    inst.programsMap.set(progKey, {
                         id: `prog-${inst.id}-${inst.programsMap.size + 1}`,
                         fieldOfStudy: fieldName,
                         degreeLevel: degreeLevel,
                         description: description ? description.slice(0, 300) : undefined
                    });
               }
          });

          return Array.from(map.values()).map(inst => ({
               id: inst.id,
               name: inst.name,
               programs: Array.from(inst.programsMap.values()).sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'))
          })).sort((a, b) => b.programs.length - a.programs.length);
     } catch (err) {
          console.warn('Using offline dataset fallback for academic institutions:', err);
          return academicInstitutions;
     }
}
