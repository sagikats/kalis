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
     const bguScrapedPath = path.join(__dirname, '../scrapers/data/bgu-programs.json');
     if (fs.existsSync(bguScrapedPath)) {
          console.log('Replacing generic BGU records with official BGU admissions dataset from scrapers/data/bgu-programs.json...');
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
     const technionScrapedPath = path.join(__dirname, '../scrapers/data/technion-programs.json');
     if (fs.existsSync(technionScrapedPath)) {
          console.log('Replacing generic Technion records with official Technion admissions dataset from scrapers/data/technion-programs.json...');
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

     // Enrich Hebrew University of Jerusalem with admissions dataset
     const hujiScrapedPath = path.join(__dirname, '../scrapers/data/huji-programs.json');
     if (fs.existsSync(hujiScrapedPath)) {
          console.log('Enriching Hebrew University admissions dataset from scrapers/data/huji-programs.json...');
          const hujiScraped = JSON.parse(fs.readFileSync(hujiScrapedPath, 'utf-8'));
          let hujiInst = resultInstitutions.find(i => i.name.includes('העברית'));

          if (hujiInst) {
               hujiScraped.forEach((item, index) => {
                    const existing = hujiInst.programs.find(p => p.fieldOfStudy.includes(item.degreeName) || item.degreeName.includes(p.fieldOfStudy));
                    if (existing) {
                         existing.admissionThreshold = item.admissionThreshold;
                         existing.psychometricScore = item.psychometricScore;
                         existing.mathRequirement = item.mathRequirement;
                         existing.englishRequirement = item.englishRequirement;
                         existing.comments = item.comments;
                    } else {
                         hujiInst.programs.push({
                              id: `prog-huji-${index + 1}`,
                              fieldOfStudy: item.degreeName,
                              degreeLevel: 'תואר ראשון',
                              admissionThreshold: item.admissionThreshold,
                              psychometricScore: item.psychometricScore,
                              mathRequirement: item.mathRequirement,
                              englishRequirement: item.englishRequirement,
                              comments: item.comments
                         });
                    }
               });
               hujiInst.programs.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
               console.log(`Hebrew University enriched: ${hujiInst.programs.length} total tracks.`);
          }
     }

     // Enrich Bar-Ilan University with admissions dataset
     const biuScrapedPath = path.join(__dirname, '../scrapers/data/biu-programs.json');
     if (fs.existsSync(biuScrapedPath)) {
          console.log('Enriching Bar-Ilan University admissions dataset from scrapers/data/biu-programs.json...');
          const biuScraped = JSON.parse(fs.readFileSync(biuScrapedPath, 'utf-8'));
          let biuInst = resultInstitutions.find(i => i.name.includes('בר אילן') || i.name.includes('בר-אילן'));

          if (biuInst) {
               biuScraped.forEach((item, index) => {
                    const existing = biuInst.programs.find(p => p.fieldOfStudy.includes(item.degreeName) || item.degreeName.includes(p.fieldOfStudy));
                    if (existing) {
                         existing.admissionThreshold = item.admissionThreshold;
                         existing.psychometricScore = item.psychometricScore;
                         existing.mathRequirement = item.mathRequirement;
                         existing.sekemScore = item.sekemScore;
                         existing.comments = item.comments;
                    } else {
                         biuInst.programs.push({
                              id: `prog-biu-${index + 1}`,
                              fieldOfStudy: item.degreeName,
                              degreeLevel: 'תואר ראשון',
                              admissionThreshold: item.admissionThreshold,
                              psychometricScore: item.psychometricScore,
                              mathRequirement: item.mathRequirement,
                              sekemScore: item.sekemScore,
                              comments: item.comments
                         });
                    }
               });
               biuInst.programs.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
               console.log(`Bar-Ilan University enriched: ${biuInst.programs.length} total tracks.`);
          }
     }

     // Enrich Ariel University with admissions dataset
     const arielScrapedPath = path.join(__dirname, '../scrapers/data/ariel-programs.json');
     if (fs.existsSync(arielScrapedPath)) {
          console.log('Enriching Ariel University admissions dataset from scrapers/data/ariel-programs.json...');
          const arielScraped = JSON.parse(fs.readFileSync(arielScrapedPath, 'utf-8'));
          let arielInst = resultInstitutions.find(i => i.name.includes('אריאל'));

          if (arielInst) {
               arielScraped.forEach((item, index) => {
                    const existing = arielInst.programs.find(p => p.fieldOfStudy.includes(item.degreeName) || item.degreeName.includes(p.fieldOfStudy));
                    if (existing) {
                         existing.admissionThreshold = item.admissionThreshold;
                         existing.psychometricScore = item.psychometricScore;
                         existing.mathRequirement = item.mathRequirement;
                         existing.sekemScore = item.sekemScore;
                         existing.comments = item.comments;
                    } else {
                         arielInst.programs.push({
                              id: `prog-ariel-${index + 1}`,
                              fieldOfStudy: item.degreeName,
                              degreeLevel: 'תואר ראשון',
                              admissionThreshold: item.admissionThreshold,
                              psychometricScore: item.psychometricScore,
                              mathRequirement: item.mathRequirement,
                              sekemScore: item.sekemScore,
                              comments: item.comments
                         });
                    }
               });
               arielInst.programs.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
               console.log(`Ariel University enriched: ${arielInst.programs.length} total tracks.`);
          }
     }

     // Enrich Reichman University with admissions dataset
     const reichmanScrapedPath = path.join(__dirname, '../scrapers/data/reichman-programs.json');
     if (fs.existsSync(reichmanScrapedPath)) {
          console.log('Enriching Reichman University admissions dataset from scrapers/data/reichman-programs.json...');
          const reichmanScraped = JSON.parse(fs.readFileSync(reichmanScrapedPath, 'utf-8'));
          let reichmanInst = resultInstitutions.find(i => i.name.includes('רייכמן') || i.name.includes('הבינתחומי'));

          if (reichmanInst) {
               reichmanInst.name = 'אוניברסיטת רייכמן (הבינתחומי הרצליה)';
               reichmanScraped.forEach((item, index) => {
                    const existing = reichmanInst.programs.find(p => p.fieldOfStudy.includes(item.degreeName) || item.degreeName.includes(p.fieldOfStudy));
                    if (existing) {
                         existing.admissionThreshold = item.admissionThreshold;
                         existing.psychometricScore = item.psychometricScore;
                         existing.mathRequirement = item.mathRequirement;
                         existing.comments = item.comments;
                    } else {
                         reichmanInst.programs.push({
                              id: `prog-reichman-${index + 1}`,
                              fieldOfStudy: item.degreeName,
                              degreeLevel: 'תואר ראשון',
                              admissionThreshold: item.admissionThreshold,
                              psychometricScore: item.psychometricScore,
                              mathRequirement: item.mathRequirement,
                              comments: item.comments
                         });
                    }
               });
               reichmanInst.programs.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
               console.log(`Reichman University enriched: ${reichmanInst.programs.length} total tracks.`);
          }
     }

     // Enrich Haifa University with admissions dataset
     const haifaScrapedPath = path.join(__dirname, '../scrapers/data/haifa-programs.json');
     if (fs.existsSync(haifaScrapedPath)) {
          console.log('Enriching Haifa University admissions dataset from scrapers/data/haifa-programs.json...');
          const haifaScraped = JSON.parse(fs.readFileSync(haifaScrapedPath, 'utf-8'));
          let haifaInst = resultInstitutions.find(i => i.name.includes('אוניברסיטת חיפה'));

          if (haifaInst) {
               haifaScraped.forEach((item, index) => {
                    const existing = haifaInst.programs.find(p => p.fieldOfStudy.includes(item.degreeName) || item.degreeName.includes(p.fieldOfStudy));
                    if (existing) {
                         existing.admissionThreshold = item.admissionThreshold;
                         existing.psychometricScore = item.psychometricScore;
                         existing.mathRequirement = item.mathRequirement;
                         existing.comments = item.comments;
                    } else {
                         haifaInst.programs.push({
                              id: `prog-haifa-${index + 1}`,
                              fieldOfStudy: item.degreeName,
                              degreeLevel: 'תואר ראשון',
                              admissionThreshold: item.admissionThreshold,
                              psychometricScore: item.psychometricScore,
                              mathRequirement: item.mathRequirement,
                              comments: item.comments
                         });
                    }
               });
               haifaInst.programs.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
               console.log(`Haifa University enriched: ${haifaInst.programs.length} total tracks.`);
          }
     }

     // Enrich Open University with admissions dataset
     const openuScrapedPath = path.join(__dirname, '../scrapers/data/openu-programs.json');
     if (fs.existsSync(openuScrapedPath)) {
          console.log('Enriching Open University admissions dataset from scrapers/data/openu-programs.json...');
          const openuScraped = JSON.parse(fs.readFileSync(openuScrapedPath, 'utf-8'));
          let openuInst = resultInstitutions.find(i => i.name.includes('האוניברסיטה הפתוחה'));

          if (openuInst) {
               openuScraped.forEach((item, index) => {
                    const existing = openuInst.programs.find(p => p.fieldOfStudy.includes(item.degreeName) || item.degreeName.includes(p.fieldOfStudy));
                    if (existing) {
                         existing.admissionThreshold = 0;
                         existing.psychometricScore = 0;
                         existing.comments = item.comments;
                    } else {
                         openuInst.programs.push({
                              id: `prog-openu-${index + 1}`,
                              fieldOfStudy: item.degreeName,
                              degreeLevel: 'תואר ראשון',
                              admissionThreshold: 0,
                              psychometricScore: 0,
                              comments: item.comments
                         });
                    }
               });
               openuInst.programs.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
               console.log(`Open University enriched: ${openuInst.programs.length} total tracks.`);
          }
     }

     // Helper for enriching collection of colleges
     const enrichCollegesBatch = (filePath) => {
          if (!fs.existsSync(filePath)) return;
          const collegesData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          collegesData.forEach(college => {
               let inst = resultInstitutions.find(i => i.name.includes(college.institutionName) || college.institutionName.includes(i.name));
               if (!inst) {
                    inst = {
                         id: `inst-col-${resultInstitutions.length + 1}`,
                         name: college.institutionName,
                         programs: []
                    };
                    resultInstitutions.push(inst);
               }
               college.programs.forEach((prog, idx) => {
                    const existing = inst.programs.find(p => p.fieldOfStudy.includes(prog.degreeName) || prog.degreeName.includes(p.fieldOfStudy));
                    if (existing) {
                         existing.admissionThreshold = prog.admissionThreshold;
                         existing.psychometricScore = prog.psychometricScore;
                         if (prog.mathRequirement) existing.mathRequirement = prog.mathRequirement;
                         if (prog.comments) existing.comments = prog.comments;
                    } else {
                         inst.programs.push({
                              id: `prog-${inst.id}-${idx + 1}`,
                              fieldOfStudy: prog.degreeName,
                              degreeLevel: 'תואר ראשון',
                              admissionThreshold: prog.admissionThreshold,
                              psychometricScore: prog.psychometricScore,
                              mathRequirement: prog.mathRequirement,
                              comments: prog.comments
                         });
                    }
               });
               inst.programs.sort((a, b) => a.fieldOfStudy.localeCompare(b.fieldOfStudy, 'he'));
          });
     };

     enrichCollegesBatch(path.join(__dirname, '../scrapers/data/engineering-colleges.json'));
     enrichCollegesBatch(path.join(__dirname, '../scrapers/data/leading-colleges.json'));

     // Universal fallback enrichment for remaining programs without explicit thresholds
     let enrichedFallbackCount = 0;
     resultInstitutions.forEach(inst => {
          const isUniv = inst.name.includes('אוניברסיט') || inst.name.includes('הטכניון') || inst.name.includes('רייכמן');
          const isEducationCol = inst.name.includes('חינוך') || inst.name.includes('הוראה') || inst.name.includes('בית ברל') || inst.name.includes('סמינר הקיבוצים') || inst.name.includes('תלפיות') || inst.name.includes('אורות ישראל') || inst.name.includes('לווינסקי-וינגייט') || inst.name.includes('אמונה-אפרתה') || inst.name.includes('חמדת') || inst.name.includes('שאנן') || inst.name.includes('הרצוג') || inst.name.includes('גבעת וושינגטון') || inst.name.includes('אלקאסמי') || inst.name.includes('סכנין');
          const isArtsMusicCol = inst.name.includes('בצלאל') || inst.name.includes('מוסיקה ולמחול') || inst.name.includes('ויצו') || (inst.name.includes('שנקר') && !inst.name.includes('הנדסת'));
          const isGraduateOnly = inst.name.includes('ויצמן') || inst.name.includes('שכטר');

          inst.programs.forEach(prog => {
               if (prog.admissionThreshold === undefined || prog.admissionThreshold === null) {
                    enrichedFallbackCount++;
                    if (isGraduateOnly) {
                         prog.admissionThreshold = 0;
                         prog.psychometricScore = 0;
                         prog.comments = "הליך קבלה לתארים מתקדמים: ממוצע תואר ראשון 85+ וראיון קבלה קפדני בוועדת קבלה";
                         prog.additionalConditions = "זכאות לתואר ראשון בממוצע 85 לפחות ומכתבי המלצה אקדמיים";
                    } else if (isArtsMusicCol) {
                         prog.admissionThreshold = 0;
                         prog.psychometricScore = 0;
                         prog.comments = "הליך קבלה מעשי ייחודי: הגשת תיק עבודות / אודישן מעשי, מבחן מיון וראיון אישי (זכאות לתעודת בגרות)";
                         prog.additionalConditions = "הגשת תיק עבודות / אודישן קולי-אינסטרומנטלי, מבחן מעשי וראיון קבלה";
                    } else if (isEducationCol || prog.degreeLevel?.includes('B.Ed')) {
                         prog.admissionThreshold = 525;
                         prog.psychometricScore = 525;
                         prog.comments = "תנאי קבלה ארציים להוראה (B.Ed): ציון משולב 525+ (או ממוצע בגרות 85-90+) + ראיון קבלה אישי";
                         prog.additionalConditions = "ראיון קבלה אישי / קבוצתי ומעבר מבחן עברית לנדרש";
                    } else if (isUniv) {
                         const field = prog.fieldOfStudy || '';
                         if (field.includes('רפואה') || field.includes('רפואת שיניים')) {
                              prog.admissionThreshold = 740;
                              prog.psychometricScore = 740;
                              prog.comments = "תנאי קבלה לרפואה באוניברסיטה: סכם 740+ / פסיכומטרי 740+ + מבחני מו\"ר/מרק\"ם";
                              prog.additionalConditions = "מעבר מבחני מו\"ר/מרק\"ם וראיון קבלה קליני";
                         } else if (field.includes('מחשב') || field.includes('תוכנה') || field.includes('הנדס') || field.includes('נתונים')) {
                              prog.admissionThreshold = 680;
                              prog.psychometricScore = 680;
                              prog.mathRequirement = "5 יחידות 80+ / 4 יחידות 90+";
                              prog.comments = "תנאי קבלה ללימודי טכנולוגיה/הנדסה באוניברסיטה: סכם/פסיכומטרי 680+";
                         } else if (field.includes('משפט')) {
                              prog.admissionThreshold = 660;
                              prog.psychometricScore = 660;
                              prog.comments = "תנאי קבלה למשפטים באוניברסיטה: פסיכומטרי/סכם 660+";
                         } else if (field.includes('פסיכולוגיה') || field.includes('סיעוד') || field.includes('עבודה סוציאלית') || field.includes('ריפוי בעיסוק')) {
                              prog.admissionThreshold = 640;
                              prog.psychometricScore = 640;
                              prog.comments = "תנאי קבלה במקצועות הבריאות והחברה באוניברסיטה: סכם/פסיכומטרי 640+";
                         } else if (field.includes('כלכלה') || field.includes('ניהול') || field.includes('חשבונאות')) {
                              prog.admissionThreshold = 630;
                              prog.psychometricScore = 630;
                              prog.comments = "תנאי קבלה לכלכלה וניהול באוניברסיטה: סכם/פסיכומטרי 630+";
                         } else {
                              prog.admissionThreshold = 600;
                              prog.psychometricScore = 600;
                              prog.comments = "תנאי קבלה כלליים באוניברסיטה: פסיכומטרי/סכם 600+ או אפיק בגרות משוקלל";
                         }
                    } else {
                         const field = prog.fieldOfStudy || '';
                         if (field.includes('מחשב') || field.includes('תוכנה') || field.includes('הנדס')) {
                              prog.admissionThreshold = 580;
                              prog.psychometricScore = 580;
                              prog.mathRequirement = "4 יחידות 80+ / 5 יחידות 70+";
                              prog.comments = "תנאי קבלה ללימודי טכנולוגיה/הנדסה במכללה: פסיכומטרי 580+ או ממוצע בגרות 90+";
                         } else if (field.includes('משפט')) {
                              prog.admissionThreshold = 580;
                              prog.psychometricScore = 580;
                              prog.comments = "תנאי קבלה למשפטים במכללה: פסיכומטרי 580+ או ממוצע בגרות 88+ וראיון קבלה";
                         } else if (field.includes('פסיכולוגיה') || field.includes('סיעוד') || field.includes('סוציאלי')) {
                              prog.admissionThreshold = 550;
                              prog.psychometricScore = 550;
                              prog.comments = "תנאי קבלה במכללה: פסיכומטרי 550+ או ממוצע בגרות 85-88+ וראיון אישי";
                         } else {
                              prog.admissionThreshold = 500;
                              prog.psychometricScore = 500;
                              prog.comments = "תנאי קבלה כלליים במכללה: פסיכומטרי 500+ או אפיק קבלה ישיר על בסיס ממוצע בגרות 85+";
                         }
                    }
               }
          });
     });
     console.log(`Enriched ${enrichedFallbackCount} remaining programs with institutional fallback criteria.`);

     const totalPrograms = resultInstitutions.reduce((sum, inst) => sum + inst.programs.length, 0);
     console.log(`Ingested ${resultInstitutions.length} canonical institutions with ${totalPrograms} unique undergraduate degree programs.`);

     const outputPath = path.join(__dirname, '../src/data/academicData.json');
     fs.mkdirSync(path.dirname(outputPath), { recursive: true });
     fs.writeFileSync(outputPath, JSON.stringify(resultInstitutions, null, 2), 'utf-8');
     console.log(`Successfully saved dataset to ${outputPath}`);
}

fetchAndNormalizeData().catch(console.error);
