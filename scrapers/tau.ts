import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface DegreeAdmissionData {
     departmentId: string | null;
     degreeName: string;
     url: string;
     thisYearAcceptance: number | null;
     thisYearRejection: number | null;
     lastYearAcceptance: number | null;
     lastYearRejection: number | null;
     hasSemesterB: boolean;
}

const BASE_URL = 'https://go.tau.ac.il';

async function fetchAllProgramUrlsFromSitemap(): Promise<string[]> {
     const sitemapUrl = `${BASE_URL}/sitemap.xml`;
     console.log(`[1] Fetching site tree from: ${sitemapUrl}...`);

     const seenUrls = new Set<string>();

     try {
          const { data: xml } = await axios.get(sitemapUrl, {
               headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
               timeout: 10000
          });

          const $ = cheerio.load(xml, { xmlMode: true });

          $('loc').each((_, el) => {
               const loc = $(el).text().trim();
               // Filter for Tel Aviv University undergraduate bachelor program pages only
               if (
                    loc.includes('/ba/') &&
                    loc.startsWith(`${BASE_URL}/he/`) &&
                    !loc.includes('?v=') &&
                    !loc.includes('/node/')
               ) {
                    seenUrls.add(loc);
               }
          });

          console.log(`[2] Found ${seenUrls.size} bachelor program URLs in Sitemap.`);
          return Array.from(seenUrls);
     } catch (error: any) {
          console.error('Sitemap fetch failed, fallback to direct search:', error.message);
          return [];
     }
}

async function scrapeSingleProgram(url: string): Promise<DegreeAdmissionData | null> {
     try {
          const { data: html } = await axios.get(url, {
               headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
               timeout: 10000
          });

          const $ = cheerio.load(html);
          const cleanTitle = $('h1').first().text().replace(/\s+/g, ' ').trim() || $('title').text().trim();

          const regex = /CRRender\([^,]+,\s*'AcceptanceChances',\s*(\{[\s\S]*?\})\);/;
          const match = html.match(regex);

          if (!match || !match[1]) {
               return null;
          }

          const config = JSON.parse(match[1]);
          const labels = config.labels || config;

          const parseNum = (val: any) => {
               const num = parseFloat(val);
               return isNaN(num) ? null : num;
          };

          return {
               departmentId: labels.field_external_department_id || null,
               degreeName: cleanTitle,
               url,
               thisYearAcceptance: parseNum(labels.field_this_year_receipt_threshol),
               thisYearRejection: parseNum(labels.field_this_year_rejection_thresh),
               lastYearAcceptance: parseNum(labels.field_last_year_receipt_threshol),
               lastYearRejection: parseNum(labels.field_last_year_rejection_thresh),
               hasSemesterB: labels.semester_b_available === 1
          };
     } catch {
          return null;
     }
}

async function runFullScraper() {
     const urls = await fetchAllProgramUrlsFromSitemap();
     const results: DegreeAdmissionData[] = [];

     console.log(`[3] Scraping full university catalog (${urls.length} degrees)...`);

     for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          const data = await scrapeSingleProgram(url);

          if (data && data.departmentId) {
               results.push(data);
               console.log(`[${i + 1}/${urls.length}] ✓ ${data.degreeName} (ID: ${data.departmentId}) | סף: ${data.thisYearAcceptance ?? 'ללא סכם מספרי'}`);
          } else {
               console.log(`[${i + 1}/${urls.length}] - Skipped: ${url.split('/').pop()}`);
          }

          await new Promise((res) => setTimeout(res, 350));
     }

     const outputPath = path.join(__dirname, 'tau-programs.json');
     fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
     console.log(`\n🎉 Completed! Total ${results.length} admission profiles saved to ${outputPath}`);
}

runFullScraper();
