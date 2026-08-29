import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface BguAdmissionData {
     departmentId: number;
     departmentName: string;
     pathName: string;
     pathDescription: string | null;
     degreeName: string;
     url: string;
     sekemScore: number | null;
     sekemLabel: string;
     psychometricScore: number | null;
     psychometricInfo: string | null;
     bagrutAverage: number | null;
     bagrutInfo: string | null;
     mathRequirement: string | null;
     englishRequirement: string | null;
     hebrewRequirement: string | null;
     additionalConditionsText: string | null;
     commentsText: string | null;
     registrationStatus: string;
}

const APEX_API_URL = 'https://bgu4u22.bgu.ac.il/apex/10g/candidate_site/GetRdpData/?p_lang=he&p_year=2026&p_semester=1';

function cleanHtmlText(htmlStr: string | null | undefined): string | null {
     if (!htmlStr) return null;
     const text = htmlStr
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\n\s*\n+/g, '\n')
          .trim();
     return text || null;
}

function parseKeyValuePairs(infoStr: string | null | undefined): Record<string, string> {
     if (!infoStr) return {};
     const map: Record<string, string> = {};
     const parts = infoStr.split('$');
     for (const part of parts) {
          const match = part.match(/^(?:\d+=)?([^=]+)=(.*)$/);
          if (match) {
               map[match[1].trim()] = match[2].trim();
          } else if (part.trim()) {
               map[part.trim()] = part.trim();
          }
     }
     return map;
}

export async function runBguScraper(): Promise<BguAdmissionData[]> {
     console.log(`[1] Fetching BGU undergraduate admission profiles from APEX API...`);

     try {
          const { data } = await axios.get(APEX_API_URL, {
               headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'application/json'
               },
               timeout: 15000
          });

          if (!data || !Array.isArray(data.items)) {
               console.error('Invalid response structure from BGU APEX API:', data);
               return [];
          }

          const rawItems = data.items;
          console.log(`[2] Received ${rawItems.length} raw profile items from BGU.`);

          const results: BguAdmissionData[] = rawItems.map((item: any) => {
               const deptName = (item.department_dsc || '').trim();
               const pathName = (item.path_dsc || '').trim();
               const pathDesc = item.path_description ? item.path_description.trim() : null;

               let degreeName = deptName;
               if (pathName && pathName !== deptName && !pathName.includes(deptName)) {
                    degreeName = `${deptName} - ${pathName}`;
               }

               const bagrutMap = parseKeyValuePairs(item.bagrut_info);
               const psychoMap = parseKeyValuePairs(item.psycho_info);

               const mathReq = bagrutMap['מתמטיקה'] || psychoMap['מתמטיקה'] || null;
               const englishReq = bagrutMap['אנגלית'] || bagrutMap['רמה באנגלית'] || psychoMap['רמה באנגלית'] || null;
               const hebrewReq = bagrutMap['רמה בעברית לנדרשים'] || psychoMap['רמה בעברית לנדרשים'] || null;

               const additionalText = cleanHtmlText(item.bagrut_additional);
               const commentsText = cleanHtmlText(item.comments);

               return {
                    departmentId: item.department,
                    departmentName: deptName,
                    pathName: pathName,
                    pathDescription: pathDesc,
                    degreeName: degreeName,
                    url: item.department_url || 'https://www.bgu.ac.il/welcome/ba/reception-section-lobby/?semesters=012027',
                    sekemScore: typeof item.psycho_sekem === 'number' ? item.psycho_sekem : null,
                    sekemLabel: item.sekem_label || 'סכם',
                    psychometricScore: typeof item.psycho_value === 'number' ? item.psycho_value : null,
                    psychometricInfo: item.psycho_info || null,
                    bagrutAverage: typeof item.bagrut_average === 'number' ? item.bagrut_average : null,
                    bagrutInfo: item.bagrut_info || null,
                    mathRequirement: mathReq,
                    englishRequirement: englishReq,
                    hebrewRequirement: hebrewReq,
                    additionalConditionsText: additionalText,
                    commentsText: commentsText,
                    registrationStatus: item.reg_status || 'לא ידוע'
               };
          });

          console.log(`[3] Processed ${results.length} normalized BGU admission profiles.`);

          const outputDir = path.join(__dirname, 'data');
          if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
          const outputPath = path.join(outputDir, 'bgu-programs.json');
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
          console.log(`\n🎉 Completed! Total ${results.length} admission profiles saved to ${outputPath}`);

          return results;
     } catch (error: any) {
          console.error('BGU Scraper failed:', error.message);
          return [];
     }
}

if (require.main === module) {
     runBguScraper();
}
