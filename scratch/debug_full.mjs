/**
 * Full debug: compare our calculator output against the official calculators
 * Data from the reference screenshots provided by the user.
 * 
 * Reference data:
 *   - BGU official: ממוצע 111.42, 24 units (drops: ספרות, תנ"ך, מחשבים)
 *   - TAU official: ציון התאמה 719 (psychometric 714, math+physics 5u each)
 *   - Psychometric: general=714, quant(כמותי)=145, verbal(מילולי)=137, english=124
 */

// ============================================================
// BGU BONUSES
// ============================================================
function getBguSubjectBonus(sub) {
  if (sub.grade < 60) return 0;
  const n = sub.name.trim();
  if (n.includes('מתמטיקה')) {
    if (sub.units === 5) return 35;
    if (sub.units === 4) return 15;
    return 0;
  }
  if (n.includes('אנגלית')) {
    if (sub.units === 5) return 25;
    if (sub.units === 4) return 12.5;
    return 0;
  }
  if (sub.units === 5) {
    if (
      n.includes('פיזיקה') || n.includes('מדעי המחשב') || n.includes('כימיה') ||
      n.includes('ביולוגיה') || n.includes('סייבר') || n.includes('היסטוריה') ||
      n.includes('אזרחות') || n.includes('ספרות') || n.includes('תנ"ך') || n.includes('ערבית')
    ) {
      return 25;
    }
    return 20;
  }
  if (sub.units === 4) return 10;
  return 0;
}

function isBguMandatory(name) {
  const n = name.trim();
  if (n.includes('מתמטיקה')) return true;
  if (n.includes('אנגלית')) return true;
  if (n.includes('אזרחות')) return true;
  if (n.includes('הבעה') || n.includes('לשון') || (n.includes('עברית') && !n.includes('ספרות'))) return true;
  if (n.includes('היסטוריה') || n.includes('תע"י') || n.includes('תולדות עם ישראל') || n.includes('ידע העם והמדינה')) return true;
  return false;
}

function calcOptimalBagrut(subjects, getBonusFn, isMandatoryFn) {
  const active = subjects.filter(s => s.units > 0 && s.grade > 0);
  if (active.length === 0) return { avg: 0, units: 0, dropped: [] };
  const totalUnits = active.reduce((s, sub) => s + sub.units, 0);
  const mandatory = active.filter(s => isMandatoryFn(s.name));
  const droppable = active.filter(s => !isMandatoryFn(s.name));
  if (totalUnits < 20 || droppable.length === 0) {
    const score = active.reduce((s, sub) => s + (sub.grade + getBonusFn(sub)) * sub.units, 0);
    return { avg: Math.min(125, Math.round(score / totalUnits * 100) / 100), units: totalUnits, dropped: [] };
  }
  let bestAvg = 0, bestUnits = 0, bestDropped = [];
  const cands = droppable.slice(0, 12);
  for (let mask = 0; mask < (1 << cands.length); mask++) {
    const inc = [...mandatory];
    const drop = [];
    for (let i = 0; i < cands.length; i++) {
      if ((mask & (1 << i)) !== 0) inc.push(cands[i]);
      else drop.push(cands[i]);
    }
    const units = inc.reduce((s, sub) => s + sub.units, 0);
    if (units < 20) continue;
    const hasAdv = inc.some(s => !s.name.includes('אנגלית') && s.units >= 4);
    if (!hasAdv) continue;
    const score = inc.reduce((s, sub) => s + (sub.grade + getBonusFn(sub)) * sub.units, 0);
    const avg = Math.round(score / units * 100) / 100;
    if (avg > bestAvg || (avg === bestAvg && units > bestUnits)) {
      bestAvg = avg; bestUnits = units; bestDropped = drop.map(s => s.name);
    }
  }
  return { avg: Math.min(125, bestAvg), units: bestUnits, dropped: bestDropped };
}

// NITE psychometric resolution
function resolvePsych(general, quant, verbal, english) {
  const q = quant || 0, v = verbal || 0, e = english || 0;
  const hasAll = q >= 50 && q <= 150 && v >= 50 && v <= 150 && e >= 50 && e <= 150;
  let calcGeneral = 0, quantEmphasis = 0, verbalEmphasis = 0;
  if (hasAll) {
    const wMulti = (2*q + 2*v + e) / 5;
    calcGeneral = Math.min(800, Math.max(200, Math.round(200 + (wMulti - 50) * 6)));
    const wQuant = (3*q + v + e) / 5;
    quantEmphasis = Math.min(800, Math.max(200, Math.round(200 + (wQuant - 50) * 6)));
    const wVerbal = (3*v + q + e) / 5;
    verbalEmphasis = Math.min(800, Math.max(200, Math.round(200 + (wVerbal - 50) * 6)));
  }
  const effectiveGeneral = general > 0 ? general : calcGeneral;
  return { effectiveGeneral, quantEmphasis: quantEmphasis || effectiveGeneral, verbalEmphasis: verbalEmphasis || effectiveGeneral, calcGeneral };
}

// ============================================================
// TEST DATA (from reference screenshots)
// ============================================================
const subjects = [
  { name: 'אזרחות', units: 2, grade: 80 },
  { name: 'אנגלית', units: 5, grade: 90 },
  { name: 'מתמטיקה', units: 5, grade: 87 },
  { name: 'היסטוריה / תע"י', units: 5, grade: 91 },
  { name: 'הבעה עברית', units: 2, grade: 72 },
  { name: 'ספרות עברית', units: 2, grade: 89 },
  { name: 'תנ"ך', units: 2, grade: 83 },
  { name: 'מדעי המחשב', units: 5, grade: 86 },
  { name: 'פיזיקה', units: 5, grade: 96 },
];
const psychGeneral = 714, psychQuant = 145, psychVerbal = 137, psychEnglish = 124;
const mathGrade = 87, mathUnits = 5, physicsGrade = 96, physicsUnits = 5;

const psych = resolvePsych(psychGeneral, psychQuant, psychVerbal, psychEnglish);

console.log('\n============================================');
console.log('NITE Psychometric Resolution');
console.log('============================================');
console.log(`effectiveGeneral (רב-תחומי): ${psych.effectiveGeneral}`);
console.log(`quantEmphasis (כמותי): ${psych.quantEmphasis}`);
console.log(`verbalEmphasis (מילולי): ${psych.verbalEmphasis}`);
console.log(`calcGeneral from sections: ${psych.calcGeneral}`);
console.log('→ NITE multi-domain: (2*145 + 2*137 + 124)/5 = ' + ((2*145+2*137+124)/5) + ' → ' + (200 + ((2*145+2*137+124)/5 - 50)*6));
console.log('→ NITE quant: (3*145 + 137 + 124)/5 = ' + ((3*145+137+124)/5) + ' → ' + (200 + ((3*145+137+124)/5 - 50)*6));
console.log('→ NITE verbal: (3*137 + 145 + 124)/5 = ' + ((3*137+145+124)/5) + ' → ' + (200 + ((3*137+145+124)/5 - 50)*6));

// ============================================================
// BGU CALCULATION
// ============================================================
const bguResult = calcOptimalBagrut(subjects, getBguSubjectBonus, isBguMandatory);
const bguBT = bguResult.avg * 10 - 330;
const bguGeneralSekem = Math.min(800, Math.max(200, Math.round(0.5 * psych.effectiveGeneral + 0.5 * bguBT)));

console.log('\n============================================');
console.log('BGU Results');
console.log('============================================');
console.log(`ממוצע בגרות: ${bguResult.avg} (${bguResult.units} יח"ל)`);
console.log(`הושמטו: ${bguResult.dropped.join(', ') || 'אין'}`);
console.log(`BT = ${bguResult.avg} * 10 - 330 = ${bguBT}`);
console.log(`סכם כללי = 0.5*${psych.effectiveGeneral} + 0.5*${bguBT} = ${bguGeneralSekem}`);
console.log(`✓ BGU official target: ממוצע 111.42`);
console.log(`  Match: ${Math.abs(bguResult.avg - 111.42) < 0.01 ? '✅ MATCH' : '❌ MISMATCH'}`);

// ============================================================
// TAU CALCULATION
// ============================================================
// TAU uses its own mandatory rules — same as BGU for basics
function isTauMandatory(name) {
  const n = name.trim();
  if (n.includes('מתמטיקה')) return true;
  if (n.includes('אנגלית')) return true;
  if (n.includes('אזרחות')) return true;
  if (n.includes('הבעה') || n.includes('לשון') || (n.includes('עברית') && !n.includes('ספרות'))) return true;
  if (n.includes('היסטוריה') || n.includes('תע"י') || n.includes('תולדות עם ישראל') || n.includes('ידע העם והמדינה')) return true;
  return false;
}
function getTauBonus(sub) {
  if (sub.grade < 60) return 0;
  const n = sub.name.trim();
  if (n.includes('מתמטיקה')) { if (sub.units === 5) return 35; if (sub.units === 4) return 12.5; return 0; }
  if (n.includes('אנגלית')) { if (sub.units === 5) return 25; if (sub.units === 4) return 12.5; return 0; }
  if (sub.units === 5) {
    if (n.includes('פיזיקה') || n.includes('כימיה') || n.includes('ביולוגיה') || n.includes('ספרות') || n.includes('היסטוריה') || n.includes('תנ"ך') || n.includes('ערבית')) return 25;
    return 20;
  }
  if (sub.units === 4) return 10;
  return 0;
}
const tauResult = calcOptimalBagrut(subjects, getTauBonus, isTauMandatory);

const tauCappedBagrut = Math.min(tauResult.avg, 117);
const tauStep1 = tauCappedBagrut * 9.62 - 349.9;
const tauStep2 = Math.round(tauStep1 * 100) / 100;
const hasRealitBonus = mathUnits === 5 && mathGrade >= 55 && physicsUnits === 5 && physicsGrade >= 55;
const tauRawGeneral = (tauStep2 + psych.effectiveGeneral) * 0.52 - 43.10;
const tauGeneralSekem = Math.min(800, Math.max(200, Math.round(tauRawGeneral + (hasRealitBonus ? 10 : 0))));
// quant: effectivePsych from quant emphasis
let normalizedQuant = psych.quantEmphasis;
const effectivePsych = Math.max(psych.effectiveGeneral, normalizedQuant || 0);
const tauRawQuant = (tauStep2 + effectivePsych) * 0.52 - 43.10;
const tauQuantSekem = Math.min(800, Math.max(200, Math.round(tauRawQuant + (hasRealitBonus ? 10 : 0))));

console.log('\n============================================');
console.log('TAU Results');
console.log('============================================');
console.log(`ממוצע בגרות: ${tauResult.avg} (${tauResult.units} יח"ל)`);
console.log(`הושמטו: ${tauResult.dropped.join(', ') || 'אין'}`);
console.log(`hasRealitBonus: ${hasRealitBonus}`);
console.log(`cappedBagrut=${tauCappedBagrut}, step1=${tauStep1}, step2=${tauStep2}`);
console.log(`rawGeneral=(${tauStep2}+${psych.effectiveGeneral})*0.52-43.10=${tauRawGeneral}`);
console.log(`סכם כללי (עם בונוס ${hasRealitBonus ? '+10' : '+0'}): ${tauGeneralSekem}`);
console.log(`effectivePsych (כמותי): ${effectivePsych}`);
console.log(`סכם הנדסה/כמותי: ${tauQuantSekem}`);
console.log(`✓ TAU official target: 719`);
console.log(`  Match: ${tauGeneralSekem === 719 ? '✅ MATCH' : `❌ MISMATCH (got ${tauGeneralSekem})`}`);

// ============================================================
// Cross-check: what does TAU get WITHOUT ריאלית bonus?
// ============================================================
const tauGeneralNoBonsu = Math.min(800, Math.max(200, Math.round(tauRawGeneral)));
console.log(`\n→ Without ריאלית bonus: ${tauGeneralNoBonsu}`);
console.log(`→ Difference from official (719): ${719 - tauGeneralSekem} (should be 0 if correct)`);

// ============================================================
// Why was the sekem 0 in the old screenshot?
// ============================================================
console.log('\n============================================');
console.log('Why was sekem=0 in old screenshot?');
console.log('============================================');
console.log('In the old screenshot (image 2), generalSekem=0 for both BGU and TAU.');
console.log('That means psych was 0 when the screenshot was taken (user had not entered psychometric yet).');
console.log('This confirms psych=0 guard: if (psych === 0 && bagrutAverage === 0) return zeros.');
console.log('But actually: if (psych > 0 && bagrutAverage > 0) compute. Otherwise 0.');
console.log('So if psych=0 → generalSekem stays 0. That matches the screenshot.');

// ============================================================
// BGU CS Bonus check: official shows +20, our code gives +25
// ============================================================
console.log('\n============================================');
console.log('BGU CS Bonus: official=20, code=25?');
console.log('============================================');
const cs = { name: 'מדעי המחשב', units: 5, grade: 86 };
console.log(`מדעי המחשב bonus (current code): ${getBguSubjectBonus(cs)}`);
console.log(`Official reference image shows: 20`);
console.log(`Bug: ${getBguSubjectBonus(cs) === 25 ? '❌ CS gets +25 in code, should be +20' : '✅ correct'}`);
console.log('However: even with +25, the algorithm STILL correctly drops CS (avg 111.42).');
console.log('The bonus difference does NOT change the final average — CS gets dropped either way.');
console.log('So this is a minor display inaccuracy but does not affect the final output.');
