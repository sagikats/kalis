// Direct simulation of TAU and BGU calculation on user's exact subjects

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

// Let's check what TAU official bonus gave:
// Look at Image 1:
// אזרחות: 2u, 80, bonus 0
// אנגלית: 5u, 90, bonus 25
// מתמטיקה: 5u, 87, bonus 35
// הסטוריה/תע"י: 5u, 91, bonus 25
// הבעה עברית: 2u, 72, bonus 0
// ספרות: 2u, 89, bonus 0 (DROPPED in TAU!)
// תנ"ך: 2u, 83, bonus 0 (DROPPED in TAU!)
// מחשבים: 5u, 86, bonus 20 (DROPPED in TAU!)
// פיזיקה: 5u, 96, bonus 25

// Let's calculate the average when ספרות, תנ"ך, מחשבים are dropped:
const keptSubs = [
  { name: 'אזרחות', units: 2, grade: 80, bonus: 0 },
  { name: 'אנגלית', units: 5, grade: 90, bonus: 25 },
  { name: 'מתמטיקה', units: 5, grade: 87, bonus: 35 },
  { name: 'הסטוריה/תע"י', units: 5, grade: 91, bonus: 25 },
  { name: 'הבעה עברית', units: 2, grade: 72, bonus: 0 },
  { name: 'פיזיקה', units: 5, grade: 96, bonus: 25 }
];

let totalScore = 0;
let totalUnits = 0;
for (const s of keptSubs) {
  totalScore += (s.grade + s.bonus) * s.units;
  totalUnits += s.units;
}
console.log('Total score:', totalScore, 'Total units:', totalUnits, 'Average:', totalScore / totalUnits);

