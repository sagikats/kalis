// Quick debug test for BGU bagrut calculation

// Simulate the BGU subject bonus
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
            n.includes('פיזיקה') ||
            n.includes('מדעי המחשב') ||
            n.includes('כימיה') ||
            n.includes('ביולוגיה') ||
            n.includes('סייבר') ||
            n.includes('היסטוריה') ||
            n.includes('אזרחות') ||
            n.includes('ספרות') ||
            n.includes('תנ"ך') ||
            n.includes('ערבית')
        ) {
            return 25;
        }
        return 20;
    }

    if (sub.units === 4) {
        return 10;
    }

    return 0;
}

function isBguMandatorySubject(name) {
    const n = name.trim();
    if (n.includes('מתמטיקה')) return true;
    if (n.includes('אנגלית')) return true;
    if (n.includes('אזרחות')) return true;
    if (n.includes('הבעה') || n.includes('לשון') || (n.includes('עברית') && !n.includes('ספרות'))) return true;
    if (n.includes('היסטוריה') || n.includes('תע"י') || n.includes('תולדות עם ישראל') || n.includes('ידע העם והמדינה')) return true;
    return false;
}

// Test subjects from reference image
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

console.log('\n=== Subject Analysis ===');
subjects.forEach(s => {
    const bonus = getBguSubjectBonus(s);
    const mandatory = isBguMandatorySubject(s.name);
    const effective = s.grade + bonus;
    console.log(`${s.name} (${s.units}u): grade=${s.grade}, bonus=${bonus}, effective=${effective}, mandatory=${mandatory}`);
});

// Full calculation
const activeSubs = subjects.filter(s => s.units > 0 && s.grade > 0);
const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
const mandatorySubs = activeSubs.filter(s => isBguMandatorySubject(s.name));
const droppableSubs = activeSubs.filter(s => !isBguMandatorySubject(s.name));

console.log('\n=== Units ===');
console.log(`Total active units: ${totalActiveUnits}`);
console.log(`Mandatory units: ${mandatorySubs.reduce((s, sub) => s + sub.units, 0)}`);
console.log(`Droppable: ${droppableSubs.map(s => s.name).join(', ')}`);

// Brute force all subsets
const candidates = droppableSubs.slice(0, 12);
let bestAvg = 0;
let bestUnits = 0;
let bestDropped = [];
let bestIncluded = activeSubs;

const numSubsets = 1 << candidates.length;
for (let mask = 0; mask < numSubsets; mask++) {
    const currentIncluded = [...mandatorySubs];
    const currentDropped = [];

    for (let i = 0; i < candidates.length; i++) {
        if ((mask & (1 << i)) !== 0) {
            currentIncluded.push(candidates[i]);
        } else {
            currentDropped.push(candidates[i]);
        }
    }

    const currentUnits = currentIncluded.reduce((sum, s) => sum + s.units, 0);
    if (currentUnits < 20) continue;

    const hasAdvanced = currentIncluded.some(s => !s.name.includes('אנגלית') && s.units >= 4);
    if (!hasAdvanced) continue;

    let currentScore = 0;
    for (const s of currentIncluded) {
        currentScore += (s.grade + getBguSubjectBonus(s)) * s.units;
    }

    const avg = Math.round((currentScore / currentUnits) * 100) / 100;
    if (avg > bestAvg || (avg === bestAvg && currentUnits > bestUnits)) {
        bestAvg = avg;
        bestUnits = currentUnits;
        bestDropped = currentDropped.map(s => s.name);
        bestIncluded = currentIncluded;
    }
}

console.log('\n=== BGU Optimal Result ===');
console.log(`Best average: ${Math.min(125, bestAvg)}`);
console.log(`Best units: ${bestUnits}`);
console.log(`Dropped: ${bestDropped.join(', ')}`);

// Manual check: drop ספרות + תנ"ך + מחשבים
console.log('\n=== Manual: drop ספרות + תנ"ך + מדעי המחשב ===');
const manual = subjects.filter(s => !['ספרות עברית', 'תנ"ך', 'מדעי המחשב'].includes(s.name));
const manualUnits = manual.reduce((sum, s) => sum + s.units, 0);
const manualScore = manual.reduce((sum, s) => sum + (s.grade + getBguSubjectBonus(s)) * s.units, 0);
console.log(`Units: ${manualUnits}`);
console.log(`Score: ${manualScore}`);
console.log(`Average: ${manualScore / manualUnits}`);

// CS bonus with +20 vs +25
console.log('\n=== CS Bonus Impact ===');
const csBonus25 = subjects.map(s => {
    if (s.name === 'מדעי המחשב') return { ...s, bonus: 25 };
    return { ...s, bonus: getBguSubjectBonus(s) };
});
const csBonus20 = subjects.map(s => {
    if (s.name === 'מדעי המחשב') return { ...s, bonus: 20 };
    return { ...s, bonus: getBguSubjectBonus(s) };
});
const scoreWith25 = csBonus25.reduce((sum, s) => sum + (s.grade + s.bonus) * s.units, 0);
const scoreWith20 = csBonus20.reduce((sum, s) => sum + (s.grade + s.bonus) * s.units, 0);
console.log(`Total score (CS +25): ${scoreWith25}, avg=${scoreWith25/33}`);
console.log(`Total score (CS +20): ${scoreWith20}, avg=${scoreWith20/33}`);

// TAU General Sekem
console.log('\n=== TAU General Sekem (check ריאלית bonus) ===');
const bagrutAvg = Math.min(125, bestAvg);
const cappedBagrut = Math.min(bagrutAvg, 117);
const step1 = cappedBagrut * 9.62 - 349.9;
const step2 = Math.round(step1 * 100) / 100;
const psych = 714;
const rawGeneral = (step2 + psych) * 0.52 - 43.10;
const generalSekem = Math.min(800, Math.max(200, Math.round(rawGeneral)));
console.log(`bagrutAvg=${bagrutAvg}, cappedBagrut=${cappedBagrut}`);
console.log(`step1=${step1}, step2=${step2}`);
console.log(`rawGeneral=${rawGeneral}`);
console.log(`generalSekem (no bonus)=${generalSekem}`);
console.log(`generalSekem (+10 reali)=${generalSekem + 10}`);
console.log(`TAU official shows 719 → expected: ${generalSekem + 10}`);
