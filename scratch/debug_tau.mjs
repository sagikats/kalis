/**
 * Debug: Why does TAU official show 112.5 but our code gives 111.42?
 * Both use the same subjects. The difference must be in BONUS RULES.
 *
 * From image 4: TAU calculator in our app shows 112.5 (24 units)
 * From debug_full: our calcOptimalBagrut(TAU rules) gives 111.42 (24 units)
 * From image 3: TAU official calculator shows 719
 *
 * Working back from TAU official 719:
 *   rawGeneral = (719 - 10 reali bonus) / 1... No.
 *   719 = round( (step2 + 714) * 0.52 - 43.10 + 10 )
 *   709 = round( (step2 + 714) * 0.52 - 43.10 )
 *   step2 = (709 + 43.10) / 0.52 - 714 = 752.1/0.52 - 714 = 1446.35 - 714 = 732.35
 *   So step2 = 732.35 → step1 ≈ 732.35
 *   cappedBagrut = (step2 + 349.9) / 9.62 = (732.35 + 349.9) / 9.62 = 1082.25 / 9.62 = 112.5
 *
 * CONCLUSION: TAU official uses bagrutAvg = 112.5!
 * But our code gives 111.42 for TAU rules.
 * So TAU MUST have a different bonus for one subject.
 *
 * Difference: 112.5 * 24 = 2700 vs 111.42 * 24 = 2674.08
 * Delta = 2700 - 2674 = 26 points in score.
 *
 * Which subject could give +26 more?
 * The subjects included are: אזרחות, אנגלית, מתמטיקה, היסטוריה, הבעה עברית, פיזיקה
 * Their scores (our code):
 *   אזרחות: 2*80 = 160
 *   אנגלית: 5*115 = 575
 *   מתמטיקה: 5*122 = 610
 *   היסטוריה: 5*116 = 580
 *   הבעה: 2*72 = 144
 *   פיזיקה: 5*121 = 605
 *   TOTAL = 2674
 *   AVG = 2674/24 = 111.42
 *
 * For avg=112.5: total score = 112.5 * 24 = 2700
 * Delta from ours = 2700 - 2674 = 26
 *
 * Could it be that TAU gives a DIFFERENT bonus to היסטוריה?
 *   - TAU official bonus table: היסטוריה/תע"י 5u → +35 (same as Math)?
 *   - Or: Math has no cap at 5u and TAU rounds differently?
 *
 * Let's check: if היסטוריה got +35 instead of +25:
 *   היסטוריה: 5*(91+35)=5*126=630 (capped at 125: 5*125=625)
 *   Delta = 625 - 580 = 45 → total = 2674+45=2719, avg=2719/24=113.29 (too high)
 *
 * If Math gets a HIGHER bonus? Already at 35 (max).
 *
 * What if TAU gives +25 to English 4u (instead of +12.5)?
 *   English is 5u, so no difference.
 *
 * What if TAU gives bonus for הבעה עברית at 2u?
 *   הבעה: 2u, normally no bonus. If +13 → 2*(72+13)=170, delta=26 → 2674+26=2700, avg=112.5 ✅
 *
 * But that seems unlikely. Let me check another option:
 * What if TAU rounds the AVERAGE differently (not at each step)?
 * Our code: Math.round(score / units * 100) / 100
 *
 * Let's try: what if TAU doesn't round the avg and uses 111.4166...
 *   step1 = 111.4166 * 9.62 - 349.9 = 1071.84... - 349.9 = 721.94...
 *   step2 = 721.94 (rounded to 2dp)
 *   rawGeneral = (721.94 + 714) * 0.52 - 43.10 = 1435.94 * 0.52 - 43.10 = 746.69 - 43.10 = 703.59
 *   generalSekem = round(703.59 + 10) = 714 (same as before)
 *
 * What if the TAU official uses bagrutAvg = 112.5 (different subject set or different bonus rules)?
 * Let's check: WHAT dropped subjects give 112.5?
 *
 * 112.5 = score / units
 * With 24 units, score = 2700
 * Increase from 2674 = 26 points
 *
 * Could מדעי המחשב NOT be dropped and something else is instead?
 * Drop ספרות+תנ"ך (4u) but KEEP מחשבים (5u), and instead drop פיזיקה??
 * No: without פיזיקה (5u dropped):
 *   inc: אזרחות(2), אנגלית(5), מתמטיקה(5), היסטוריה(5), הבעה(2), מחשבים(5) = 24u
 *   score = 160 + 575 + 610 + 580 + 144 + 555 = 2624, avg = 2624/24 = 109.33 (worse)
 *
 * What if TAU uses Math 5u bonus = +35 but ENGLISH uses a different rule at TAU?
 * TAU official bonus table for English: 5u = +25, 4u = +12.5 (same as BGU)
 *
 * MOST LIKELY EXPLANATION:
 * TAU gives History/Teyiy (היסטוריה/תע"י) the SAME bonus as Math = +35 (not +25)
 * because it's 5u with a national "reali" component?
 * OR: TAU's bonus for היסטוריה at 5u is +35 like Math.
 * Let's check: 5*(91+35) = 5*126 → BUT capped at 125: 5*125 = 625
 * Delta = 625-580 = 45... avg = (2674+45)/24 = 2719/24 = 113.3 (not 112.5)
 *
 * What if TAU uses a DIFFERENT bagrut calculation method entirely?
 * What if the TAU calculator in image 4 (our app) shows 112.5 with DIFFERENT subjects entered
 * than image 1 (reference with all 9 subjects)?
 *
 * In image 4, the visible subjects are only 6 (the right panel is cut off):
 *   היסטוריה (5u, 91), הבעה (2u, 72), אנגלית (5u, 90), מתמטיקה (5u, 87), פיזיקה (5u, 96), מחשבים (5u, 86)
 *   MISSING from view: אזרחות, ספרות, תנ"ך
 *
 * If only these 6 subjects are active (others have grade=0):
 *   active = 5+2+5+5+5+5 = 27 units
 *   mandatory (of these 6): הבעה(2), אנגלית(5), מתמטיקה(5), היסטוריה(5) = 17u
 *   droppable: מחשבים(5u,86+25=111), פיזיקה(5u,96+25=121)
 *
 *   Without drops: score = 2*(72)+5*(115)+5*(122)+5*(116)+5*(121)+5*(111) = 144+575+610+580+605+555 = 3069, avg=3069/27=113.67
 *   Drop מחשבים: 22u, score=2514, avg=114.27 ✅ 114 range
 *   Drop פיזיקה: 22u, score=3069-605=2464, avg=2464/22=112.0
 *   Drop both: 17u < 20, invalid
 *
 * So if only 6 subjects: DROP מחשבים → avg=114.27 (24u → wait: 22u not 24)
 * Hmm, 22 units, not 24. Image 4 shows "24 יח"ל (אופטימלי)". So it IS 24u.
 *
 * For 24 units with only 6 subjects active: impossible (27-6=21... no).
 * Wait: droppable = מחשבים(5u) + פיזיקה(5u). Drop מחשבים: 27-5=22u. Still not 24.
 *
 * WHAT IF אזרחות was also entered (not shown in screenshot)?
 * With אזרחות(2u,80) added to the 6:
 *   Total = 29u. mandatory += אזרחות(2) = 19u. droppable = מחשבים+פיזיקה.
 *   Drop מחשבים: 24u. score=3069+160-555=2674, avg=2674/24=111.42 (same as before!)
 *
 * But image 4 shows TAU giving 112.5 at 24u. That means either:
 * 1. The אזרחות grade is NOT 80 in the actual user entry, OR
 * 2. There's a DIFFERENT subject composition in image 4
 *
 * WAIT — maybe in image 4, ספרות+תנ"ך have grade=0 (not entered),
 * only אזרחות(80) is present. Then dropping only מחשבים gives:
 * subjects active: אזרחות(2,80), אנגלית(5,90+25), מתמטיקה(5,87+35), היסטוריה(5,91+25), הבעה(2,72), פיזיקה(5,96+25), מחשבים(5,86+25)
 * Total = 29u. Drop מחשבים(5u): 24u.
 * score = 160+575+610+580+144+605 = 2674, avg=111.42 (same!)
 *
 * UNLESS: the subjects in image 4 include all 9 original subjects but with DIFFERENT grades
 * for ספרות/תנ"ך. Let me try: if ספרות=0 and תנ"ך=0 (grade=0, not active), but
 * then drop מחשבים gives same 111.42.
 *
 * I need to find what gives EXACTLY 112.5:
 * 2700 / 24 = 112.5. Need 2700 with 24 units.
 * 2700 = 2674 + 26.
 * What +26 could exist?
 */

// Let's work backwards from TAU official 719
console.log('=== Working backwards from TAU official 719 ===');
const tauOfficial = 719;
// rawGeneral + 10 (reali) = 719 → rawGeneral = 709
const rawGeneral = 709; // before rounding
// (step2 + 714) * 0.52 - 43.10 = 709
// (step2 + 714) * 0.52 = 752.10
// step2 + 714 = 1446.35
const step2 = 1446.35 - 714;
console.log(`step2 = ${step2}`);
// step2 = bagrutAvg * 9.62 - 349.9 (step1, rounded to 2dp)
// But step2 = round(step1, 2). For step2=732.35: step1 could be anywhere in [732.345, 732.355)
const bagrutFromStep2 = (step2 + 349.9) / 9.62;
console.log(`bagrutAvg implied by TAU official = ${bagrutFromStep2}`);
// verify
const step1_check = bagrutFromStep2 * 9.62 - 349.9;
console.log(`step1 = ${step1_check}, step2 = ${Math.round(step1_check * 100) / 100}`);
const rawCheck = (Math.round(step1_check * 100) / 100 + 714) * 0.52 - 43.10;
console.log(`rawGeneral = ${rawCheck}, sekem = ${Math.round(rawCheck + 10)}`);

console.log('\n=== What bagrut average would give TAU official 719? ===');
// 719 = round((step2 + 714) * 0.52 - 43.10 + 10)
// so we need step2 such that the formula rounds to 719
for (let avg = 111.0; avg <= 114.0; avg += 0.01) {
  const avg_r = Math.round(avg * 100) / 100;
  const s1 = Math.min(avg_r, 117) * 9.62 - 349.9;
  const s2 = Math.round(s1 * 100) / 100;
  const raw = (s2 + 714) * 0.52 - 43.10;
  const sekem = Math.min(800, Math.max(200, Math.round(raw + 10)));
  if (sekem === 719) {
    console.log(`  bagrutAvg=${avg_r.toFixed(2)} → step2=${s2} → sekem=${sekem} ✅`);
  }
}

console.log('\n=== Could ספרות עברית be droppable but getting bonus? ===');
// ספרות עברית (2u, 89): bonus? Let's check TAU bonus for ספרות at 2u
// TAU bonus: 5u ספרות → +25. 2u ספרות → no bonus. So grade is 89.
// BUT: if ספרות is mandatory at TAU...
console.log('isTauMandatory("ספרות עברית"):');
const n = 'ספרות עברית';
console.log('  includes מתמטיקה:', n.includes('מתמטיקה'));
console.log('  includes אנגלית:', n.includes('אנגלית'));
console.log('  includes אזרחות:', n.includes('אזרחות'));
console.log('  includes הבעה/לשון/עברית(!ספרות):', n.includes('הבעה') || n.includes('לשון') || (n.includes('עברית') && !n.includes('ספרות')));
console.log('  includes היסטוריה:', n.includes('היסטוריה'));
console.log('  → NOT mandatory (can be dropped)');

console.log('\n=== Could "ספרות עברית" at 2u get a bonus at TAU? ===');
// TAU getTauSubjectBonus: 2u → return 0 (only 4u and 5u get bonuses)
// So ספרות עברית at 2u: effective = 89, no bonus.
// Dropping it: removes 89*2=178, avg of remaining drops!
// Wait: if ספרות is 89 and avg without it is HIGHER, then dropping helps.
// avg without dropping ספרות = (all without drop) / 33
// Let's compute: if ספרות is mandatory (NOT droppable), it must be included.

console.log('\n=== TAU bonus table differences ===');
// TAU official bonus table (from tau.ac.il):
// Math 5u: +35, 4u: +12.5
// English 5u: +25, 4u: +12.5
// Physics, Chemistry, Biology: 5u: +25
// History 5u: +35?? Let's check the TAU website description
// Actually: TAU gives +35 for History AT 5 UNITS in some versions!
console.log('If History (היסטוריה/תע"י) 5u gets +35 at TAU (same as Math):');
const histBonus35 = 5 * (91 + 35); // = 5*126 = 630, but should cap at 125
const histScore35 = 5 * Math.min(125, 91 + 35);
console.log(`  היסטוריה: 5*(91+35)=5*${Math.min(125,91+35)}=${histScore35}`);
// original: 5*(91+25)=580
console.log(`  Original: 580, new: ${histScore35}, delta: ${histScore35-580}`);
// With this change in the "drop ספרות+תנ"ך+מחשבים" scenario:
const baseScore = 160 + 575 + 610 + 580 + 144 + 605; // 2674
const scoreWithHist35 = 160 + 575 + 610 + histScore35 + 144 + 605;
console.log(`  Score with hist+35: ${scoreWithHist35}, avg/24: ${scoreWithHist35/24}`);
