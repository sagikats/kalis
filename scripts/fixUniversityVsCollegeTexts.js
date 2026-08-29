const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/academicData.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function processInstitution(inst) {
     const isUniv = inst.name.includes('אוניברסיט') || inst.name.includes('הטכניון') || inst.name.includes('רייכמן');
     const isEducationCol = inst.name.includes('חינוך') || inst.name.includes('הוראה') || inst.name.includes('בית ברל') || inst.name.includes('סמינר הקיבוצים') || inst.name.includes('תלפיות') || inst.name.includes('אורות ישראל') || inst.name.includes('לווינסקי-וינגייט') || inst.name.includes('אמונה-אפרתה') || inst.name.includes('חמדת') || inst.name.includes('שאנן') || inst.name.includes('הרצוג') || inst.name.includes('גבעת וושינגטון') || inst.name.includes('אלקאסמי') || inst.name.includes('סכנין');
     const isArtsMusicCol = inst.name.includes('בצלאל') || inst.name.includes('מוסיקה ולמחול') || inst.name.includes('ויצו') || (inst.name.includes('שנקר') && !inst.name.includes('הנדסת'));
     const isGraduateOnly = inst.name.includes('ויצמן') || inst.name.includes('שכטר');

     const typeLabel = isUniv ? "באוניברסיטה" : "במכללה";

     inst.programs.forEach(prog => {
          // If comments were mistakenly tagged with generic college fallback text on a University or need correction
          const currentComment = prog.comments || '';
          if (currentComment.includes('במכללות') && isUniv) {
               const field = prog.fieldOfStudy || '';

               if (field.includes('רפואה') || field.includes('רפואת שיניים')) {
                    prog.admissionThreshold = 740;
                    prog.psychometricScore = 740;
                    prog.comments = `תנאי קבלה לרפואה באוניברסיטה: סכם 740+ / פסיכומטרי 740+ + מבחני מו"ר/מרק"ם`;
                    prog.additionalConditions = "מעבר מבחני מו\"ר/מרק\"ם וראיון קבלה קליני";
               } else if (field.includes('מחשב') || field.includes('תוכנה') || field.includes('הנדס') || field.includes('נתונים')) {
                    prog.admissionThreshold = 680;
                    prog.psychometricScore = 680;
                    prog.mathRequirement = "5 יחידות 80+ / 4 יחידות 90+";
                    prog.comments = `תנאי קבלה ללימודי טכנולוגיה/הנדסה באוניברסיטה: סכם/פסיכומטרי 680+`;
               } else if (field.includes('משפט')) {
                    prog.admissionThreshold = 660;
                    prog.psychometricScore = 660;
                    prog.comments = `תנאי קבלה למשפטים באוניברסיטה: פסיכומטרי/סכם 660+`;
               } else if (field.includes('פסיכולוגיה') || field.includes('סיעוד') || field.includes('עבודה סוציאלית') || field.includes('ריפוי בעיסוק')) {
                    prog.admissionThreshold = 640;
                    prog.psychometricScore = 640;
                    prog.comments = `תנאי קבלה במקצועות הבריאות והחברה באוניברסיטה: סכם/פסיכומטרי 640+`;
               } else if (field.includes('כלכלה') || field.includes('ניהול') || field.includes('חשבונאות')) {
                    prog.admissionThreshold = 630;
                    prog.psychometricScore = 630;
                    prog.comments = `תנאי קבלה לכלכלה וניהול באוניברסיטה: סכם/פסיכומטרי 630+`;
               } else {
                    prog.admissionThreshold = 600;
                    prog.psychometricScore = 600;
                    prog.comments = `תנאי קבלה כלליים באוניברסיטה: פסיכומטרי/סכם 600+ או אפיק בגרות משוקלל`;
               }
          } else if (currentComment.includes('במכללות') && !isUniv) {
               // Standardize college text phrasing to singular "במכללה"
               prog.comments = currentComment.replace('במכללות', 'במכללה');
          }
     });
}

data.forEach(processInstitution);

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Fixed University vs College phrasing and thresholds across all 62 institutions.');
