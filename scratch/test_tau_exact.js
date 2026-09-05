// Test exact tauCalculator.ts logic

function isTauMandatorySubject(name) {
     const n = name.trim();
     if (n.includes('מתמטיקה')) return true;
     if (n.includes('אנגלית')) return true;
     if (n.includes('אזרחות')) return true;
     if (n.includes('הבעה') || n.includes('עברית')) return true;
     if (n.includes('היסטוריה') || n.includes('תע"י') || n.includes('תולדות עם ישראל') || n.includes('ידע העם והמדינה')) return true;
     return false;
}

function getTauSubjectBonus(sub) {
     if (sub.grade < 60) return 0;
     const subName = sub.name.trim();

     if (subName.includes('מתמטיקה')) {
          if (sub.units === 5) return 35;
          if (sub.units === 4) return 12.5;
          return 0;
     }

     if (subName.includes('אנגלית')) {
          if (sub.units === 5) return 25;
          if (sub.units === 4) return 12.5;
          return 0;
     }

     if (sub.units === 5) {
          if (
               subName.includes('פיזיקה') ||
               subName.includes('כימיה') ||
               subName.includes('ביולוגיה') ||
               subName.includes('ספרות') ||
               subName.includes('היסטוריה') ||
               subName.includes('תנ"ך') ||
               subName.includes('ערבית')
          ) {
               return 25;
          }
          return 20; // Computer Science, Social Sciences, Arts, etc.
     }

     if (sub.units === 4) {
          return 10;
     }

     return 0;
}

function calculateOptimalTauBagrut(subjects) {
     const activeSubs = subjects.filter(s => s.units > 0 && s.grade > 0);
     const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);

     const mandatorySubs = activeSubs.filter(s => isTauMandatorySubject(s.name));
     const droppableSubs = activeSubs.filter(s => !isTauMandatorySubject(s.name));

     console.log('Mandatory subs:', mandatorySubs.map(s => s.name));
     console.log('Droppable subs:', droppableSubs.map(s => s.name));

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

          // Check for at least one advanced (>= 4 units) subject besides English
          const hasAdvanced = currentIncluded.some(s => !s.name.includes('אנגלית') && s.units >= 4);
          if (!hasAdvanced) continue;

          let currentScore = 0;
          for (const s of currentIncluded) {
               currentScore += (s.grade + getTauSubjectBonus(s)) * s.units;
          }

          const avg = Math.round((currentScore / currentUnits) * 100) / 100;
          if (avg > bestAvg || (avg === bestAvg && currentUnits > bestUnits)) {
               bestAvg = avg;
               bestUnits = currentUnits;
               bestDropped = currentDropped;
               bestIncluded = currentIncluded;
          }
     }

     return {
          average: Math.min(125, bestAvg),
          optimalUnits: bestUnits,
          totalUnits: totalActiveUnits,
          droppedSubjects: bestDropped,
          includedSubjects: bestIncluded
     };
}

const subjects = [
  { name: 'אזרחות', units: 2, grade: 80 },
  { name: 'אנגלית', units: 5, grade: 90 },
  { name: 'מתמטיקה', units: 5, grade: 87 },
  { name: 'היסטוריה / תע"י', units: 5, grade: 91 },
  { name: 'הבעה עברית', units: 2, grade: 72 },
  { name: 'ספרות עברית', units: 2, grade: 89 },
  { name: 'תנ"ך', units: 2, grade: 83 },
  { name: 'מדעי המחשב', units: 5, grade: 86 },
  { name: 'פיזיקה', units: 5, grade: 96 }
];

console.log(calculateOptimalTauBagrut(subjects));
