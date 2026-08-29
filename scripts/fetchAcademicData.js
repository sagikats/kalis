const fs = require('fs');
const path = require('path');

const API_URL = 'https://data.gov.il/api/3/action/datastore_search?resource_id=9d656232-3329-4e41-bd6f-a793644b4ea6&limit=3000';

function normalizeInstitutionName(rawName) {
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

function isIsraeliInstitution(name) {
     const lower = name.toLowerCase();
     const foreignKeywords = [
          'אירן', 'אוקראינה', 'הולנד', 'רוסיה', 'אוזבקיסטן', 'ברית המועצות', 'ארה"ב', 'ארה״ב',
          'בריטניה', 'גרוזיה', 'ארצות הברית', 'ברזיל', 'בלירוסיה', 'ברילנגטון', 'אנגליה', 'גרמניה',
          'ביר זית', 'אל-קודס', 'ג\'נין', 'ג"נין', 'אמריקראית', 'פוליטכנית בניו יורק', 'המכולכת', 'הממלכותי'
     ];
     return !foreignKeywords.some(fk => lower.includes(fk));
}

async function fetchAndNormalizeData() {
     console.log('Fetching data from data.gov.il...');
     const res = await fetch(API_URL);
     const json = await res.json();

     if (!json.success || !json.result || !json.result.records) {
          console.error('Failed to fetch dataset:', json);
          process.exit(1);
     }

     const rawRecords = json.result.records;
     const isFirstDegree = (record) => {
          const level = (record.Degree_level || '').trim();
          if (!level) return false;

          const isMasterOrDoc = /M\.Sc|M\.A|M\.B\.A|M\.Mus|M\.S\.W|M\.Ed|Ph\.D|תואר שני|תואר שלישי|מוסמך|דוקטור/i.test(level);
          if (isMasterOrDoc) return false;

          const undergraduatePrefixes = [
               'B.Sc', 'B.A', 'B.Sc.Agr', 'LL.B', 'B.Ed', 'B.Des', 'B.S.W',
               'B.Mus', 'B.Tech', 'B.N', 'B.O.T', 'B.P.T', 'B.Med.Sc', 'B.P.H',
               'תואר ראשון', 'בוגר', 'B.A.', 'B.Sc.', 'LL.B.'
          ];

          const matchesPrefix = undergraduatePrefixes.some(prefix =>
               level.toLowerCase().startsWith(prefix.toLowerCase()) || level.toLowerCase().includes(prefix.toLowerCase())
          );

          return matchesPrefix || level.includes('ראשון');
     };

     const filteredRecords = rawRecords.filter(isFirstDegree);
     const institutionMap = new Map();

     filteredRecords.forEach((rec) => {
          const rawInstName = (rec.institution_name || '').trim();
          const instName = normalizeInstitutionName(rawInstName);
          const fieldName = (rec.Field_of_Education || rec.Placement_recommendations || '').trim().replace(/\s+/g, ' ');
          const degreeLevel = (rec.Degree_level || 'תואר ראשון').trim();
          const description = (rec.Explanations || rec.Faculty_Name || '').trim();

          if (!instName || !fieldName || !isIsraeliInstitution(instName)) return;

          if (!institutionMap.has(instName)) {
               institutionMap.set(instName, {
                    id: `inst-${institutionMap.size + 1}`,
                    name: instName,
                    programsMap: new Map()
               });
          }

          const inst = institutionMap.get(instName);
          const normalizedField = fieldName.toLowerCase();
          const progKey = `${normalizedField}`;

          if (!inst.programsMap.has(progKey)) {
               inst.programsMap.set(progKey, {
                    id: `prog-${inst.id}-${inst.programsMap.size + 1}`,
                    fieldOfStudy: fieldName,
                    degreeLevel: degreeLevel,
                    description: description ? description.slice(0, 300) : undefined
               });
          }
     });

     const resultInstitutions = Array.from(institutionMap.values()).map(inst => ({
          id: inst.id,
          name: inst.name,
          programs: Array.from(inst.programsMap.values()).sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'))
     })).sort((a, b) => b.programs.length - a.programs.length);

     // Enrich/Replace Ben-Gurion University with official scraped APEX admissions dataset
     const bguScrapedPath = path.join(__dirname, '../scrapers/bgu-programs.json');
     if (fs.existsSync(bguScrapedPath)) {
          console.log('Replacing generic BGU records with official BGU admissions dataset from scrapers/bgu-programs.json...');
          const bguScraped = JSON.parse(fs.readFileSync(bguScrapedPath, 'utf-8'));
          let bguInst = resultInstitutions.find(i => i.name === 'אוניברסיטת בן גוריון בנגב');

          if (!bguInst) {
               bguInst = {
                    id: `inst-bgu`,
                    name: 'אוניברסיטת בן גוריון בנגב',
                    programs: []
               };
               resultInstitutions.push(bguInst);
          }

          const officialBguPrograms = bguScraped.map((item, index) => {
               const fieldName = item.pathName && item.pathName !== item.departmentName
                    ? `${item.departmentName} (${item.pathName})`
                    : item.degreeName || item.departmentName;

               return {
                    id: `prog-bgu-${index + 1}`,
                    fieldOfStudy: fieldName,
                    degreeLevel: 'תואר ראשון',
                    description: item.pathDescription || undefined,
                    admissionThreshold: item.sekemScore !== null ? item.sekemScore : (item.psychometricScore !== null ? item.psychometricScore : null),
                    sekemScore: item.sekemScore,
                    psychometricScore: item.psychometricScore,
                    mathRequirement: item.mathRequirement,
                    englishRequirement: item.englishRequirement,
                    hebrewRequirement: item.hebrewRequirement,
                    additionalConditions: item.additionalConditionsText,
                    comments: item.commentsText,
                    registrationStatus: item.registrationStatus,
                    url: item.url
               };
          });

          bguInst.programs = officialBguPrograms.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
          console.log(`BGU dataset cleaned: Exactly ${bguInst.programs.length} official BGU degree tracks.`);
     }

     // Enrich Tel Aviv University with scraped admission thresholds
     const tauInst = resultInstitutions.find(i => i.name === 'אוניברסיטת תל אביב');
     if (tauInst) {
          const enrichTauScriptPath = path.join(__dirname, 'enrichTauThresholds.js');
          if (fs.existsSync(enrichTauScriptPath)) {
               console.log('Enriching Tel Aviv University admission thresholds...');
               const { enrichTauInstitution } = require('./enrichTauThresholds.js');
               enrichTauInstitution(tauInst);
          }
     }

     // Enrich/Replace Technion - Israel Institute of Technology with official scraped admissions dataset
     const technionScrapedPath = path.join(__dirname, '../scrapers/technion-programs.json');
     if (fs.existsSync(technionScrapedPath)) {
          console.log('Replacing generic Technion records with official Technion admissions dataset from scrapers/technion-programs.json...');
          const technionScraped = JSON.parse(fs.readFileSync(technionScrapedPath, 'utf-8'));
          let technionInst = resultInstitutions.find(i => i.name.includes('טכניון'));

          if (!technionInst) {
               technionInst = {
                    id: `inst-technion`,
                    name: 'הטכניון - מכון טכנולוגי לישראל',
                    programs: []
               };
               resultInstitutions.push(technionInst);
          }

          technionInst.programs = technionScraped.map((item, index) => ({
               id: `prog-technion-${index + 1}`,
               fieldOfStudy: item.degreeName,
               degreeLevel: 'תואר ראשון',
               description: item.excellenceSekemScore ? `סכם מצטיינים: ${item.excellenceSekemScore}` : undefined,
               admissionThreshold: item.sekemScore,
               sekemScore: item.sekemScore,
               comments: item.comments,
               registrationStatus: item.registrationStatus
          })).sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));

          console.log(`Technion dataset cleaned: Exactly ${technionInst.programs.length} official Technion degree tracks.`);
     }

     const totalPrograms = resultInstitutions.reduce((sum, inst) => sum + inst.programs.length, 0);
     console.log(`Ingested ${resultInstitutions.length} canonical institutions with ${totalPrograms} unique undergraduate degree programs.`);

     const outputPath = path.join(__dirname, '../src/data/academicData.json');
     fs.mkdirSync(path.dirname(outputPath), { recursive: true });
     fs.writeFileSync(outputPath, JSON.stringify(resultInstitutions, null, 2), 'utf-8');
     console.log(`Successfully saved dataset to ${outputPath}`);
}

fetchAndNormalizeData().catch(console.error);
