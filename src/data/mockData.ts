import { University, Degree, CurriculumNode, DailyTask, ExceptionDate } from '../types/planner';

export const UNIVERSITIES: University[] = [
     'טכניון',
     'אוניברסיטת תל אביב',
     'האוניברסיטה העברית',
     'אוניברסיטת בן-גוריון',
     'אוניברסיטת חיפה',
     'אוניברסיטת אריאל בשומרון',
     'אוניברסיטת בר-אילן',
     'אוניברסיטת רייכמן'
];

export const DEGREES: Degree[] = [
     'מדעי המחשב',
     'הנדסת חשמל',
     'רפואה',
     'משפטים',
     'פסיכולוגיה',
     'כלכלה'
];

export const DEGREE_THRESHOLDS: Record<University, Record<Degree, { sekem: number; reqMath: number; estHours: number }>> = {
     'טכניון': {
          'מדעי המחשב': { sekem: 88.5, reqMath: 5, estHours: 140 },
          'הנדסת חשמל': { sekem: 86.0, reqMath: 5, estHours: 130 },
          'רפואה': { sekem: 93.0, reqMath: 5, estHours: 210 },
          'משפטים': { sekem: 78.0, reqMath: 4, estHours: 90 },
          'פסיכולוגיה': { sekem: 80.0, reqMath: 4, estHours: 95 },
          'כלכלה': { sekem: 82.0, reqMath: 4, estHours: 100 }
     },
     'אוניברסיטת תל אביב': {
          'מדעי המחשב': { sekem: 690, reqMath: 5, estHours: 135 },
          'הנדסת חשמל': { sekem: 675, reqMath: 5, estHours: 125 },
          'רפואה': { sekem: 735, reqMath: 5, estHours: 200 },
          'משפטים': { sekem: 645, reqMath: 4, estHours: 85 },
          'פסיכולוגיה': { sekem: 650, reqMath: 4, estHours: 90 },
          'כלכלה': { sekem: 660, reqMath: 4, estHours: 95 }
     },
     'האוניברסיטה העברית': {
          'מדעי המחשב': { sekem: 705, reqMath: 5, estHours: 145 },
          'הנדסת חשמל': { sekem: 680, reqMath: 5, estHours: 130 },
          'רפואה': { sekem: 740, reqMath: 5, estHours: 220 },
          'משפטים': { sekem: 655, reqMath: 4, estHours: 88 },
          'פסיכולוגיה': { sekem: 660, reqMath: 4, estHours: 92 },
          'כלכלה': { sekem: 670, reqMath: 4, estHours: 98 }
     },
     'אוניברסיטת בן-גוריון': {
          'מדעי המחשב': { sekem: 535, reqMath: 5, estHours: 130 },
          'הנדסת חשמל': { sekem: 520, reqMath: 5, estHours: 120 },
          'רפואה': { sekem: 720, reqMath: 5, estHours: 195 },
          'משפטים': { sekem: 630, reqMath: 4, estHours: 80 },
          'פסיכולוגיה': { sekem: 640, reqMath: 4, estHours: 85 },
          'כלכלה': { sekem: 645, reqMath: 4, estHours: 90 }
     },
     'אוניברסיטת חיפה': {
          'מדעי המחשב': { sekem: 660, reqMath: 5, estHours: 125 },
          'הנדסת חשמל': { sekem: 640, reqMath: 5, estHours: 115 },
          'רפואה': { sekem: 710, reqMath: 5, estHours: 190 },
          'משפטים': { sekem: 620, reqMath: 4, estHours: 80 },
          'פסיכולוגיה': { sekem: 630, reqMath: 4, estHours: 85 },
          'כלכלה': { sekem: 635, reqMath: 4, estHours: 85 }
     },
     'אוניברסיטת אריאל בשומרון': {
          'מדעי המחשב': { sekem: 650, reqMath: 5, estHours: 120 },
          'הנדסת חשמל': { sekem: 630, reqMath: 5, estHours: 110 },
          'רפואה': { sekem: 715, reqMath: 5, estHours: 195 },
          'משפטים': { sekem: 615, reqMath: 4, estHours: 75 },
          'פסיכולוגיה': { sekem: 625, reqMath: 4, estHours: 80 },
          'כלכלה': { sekem: 630, reqMath: 4, estHours: 80 }
     },
     'אוניברסיטת בר-אילן': {
          'מדעי המחשב': { sekem: 685, reqMath: 5, estHours: 135 },
          'הנדסת חשמל': { sekem: 665, reqMath: 5, estHours: 125 },
          'רפואה': { sekem: 730, reqMath: 5, estHours: 200 },
          'משפטים': { sekem: 640, reqMath: 4, estHours: 85 },
          'פסיכולוגיה': { sekem: 645, reqMath: 4, estHours: 90 },
          'כלכלה': { sekem: 650, reqMath: 4, estHours: 90 }
     },
     'אוניברסיטת רייכמן': {
          'מדעי המחשב': { sekem: 660, reqMath: 5, estHours: 125 },
          'הנדסת חשמל': { sekem: 640, reqMath: 5, estHours: 115 },
          'רפואה': { sekem: 710, reqMath: 5, estHours: 180 },
          'משפטים': { sekem: 620, reqMath: 4, estHours: 80 },
          'פסיכולוגיה': { sekem: 630, reqMath: 4, estHours: 85 },
          'כלכלה': { sekem: 610, reqMath: 4, estHours: 80 }
     }
};

export const SYLLABUS_TOPICS_MATH_5 = [
     { id: 'm1', title: 'חדו״א - נגזרות של פונקציות טריגונומטריות', hours: 14 },
     { id: 'm2', title: 'חדו״א - אינטגרלים ושטחים מורכבים', hours: 18 },
     { id: 'm3', title: 'חדו״א - פונקציות מעריכיות ולוגריתמיות', hours: 16 },
     { id: 'm4', title: 'גיאומטריה אנליטית - המעגל, האליפסה וההיפרבולה', hours: 15 },
     { id: 'm5', title: 'ווקטורים - ווקטורים גיאומטריים ואלגבריים', hours: 16 },
     { id: 'm6', title: 'מספרים מרוכבים - הצגה קוטבית ומשפט דה-מואבר', hours: 14 },
     { id: 'm7', title: 'הסתברות קלאסית ונוסחת ברנולי', hours: 12 },
     { id: 'm8', title: 'טריגונומטריה במרחב - פירמידות ומנסרות', hours: 15 }
];

export const INITIAL_CURRICULUM: CurriculumNode[] = [
     {
          id: 'c1',
          title: 'פרק 1: חדו״א (חשבון דיפרנציאלי ואינטגרלי)',
          status: 'in_progress',
          estimatedHours: 48,
          completedHours: 32,
          subtopics: [
               { id: 'c1-1', title: 'נגזרות של פונקציות מעריכיות ולוגריתמיות', status: 'reviewed', estimatedHours: 16, completedHours: 16 },
               { id: 'c1-2', title: 'אינטגרלים מורכבים וחישובי נפחים', status: 'practiced', estimatedHours: 18, completedHours: 16 },
               { id: 'c1-3', title: 'חקירת פונקציות טריגונומטריות', status: 'in_progress', estimatedHours: 14, completedHours: 0 }
          ]
     },
     {
          id: 'c2',
          title: 'פרק 2: ווקטורים וגיאומטריה אנליטית',
          status: 'in_progress',
          estimatedHours: 31,
          completedHours: 15,
          subtopics: [
               { id: 'c2-1', title: 'ווקטורים אלגבריים ומכפלה סקלרית', status: 'practiced', estimatedHours: 16, completedHours: 15 },
               { id: 'c2-2', title: 'המעגל והאליפסה במישור', status: 'not_started', estimatedHours: 15, completedHours: 0 }
          ]
     },
     {
          id: 'c3',
          title: 'פרק 3: מספרים מרוכבים',
          status: 'not_started',
          estimatedHours: 14,
          completedHours: 0,
          subtopics: [
               { id: 'c3-1', title: 'הצגה קוטבית ופעולות חשבון', status: 'not_started', estimatedHours: 6, completedHours: 0 },
               { id: 'c3-2', title: 'משפט דה-מואבר ושורשי יחידה', status: 'not_started', estimatedHours: 8, completedHours: 0 }
          ]
     },
     {
          id: 'c4',
          title: 'שבועות מרתון וסימולציות ארציות (נעול ב 14 ימים האחרונים)',
          status: 'not_started',
          estimatedHours: 27,
          completedHours: 0,
          subtopics: [
               { id: 'c4-1', title: 'סימולציה 1 - תנאי בחינה מלאים', status: 'not_started', estimatedHours: 5, completedHours: 0 },
               { id: 'c4-2', title: 'סימולציה 2 - ניתוח טעויות ורשתות ביטחון', status: 'not_started', estimatedHours: 6, completedHours: 0 },
               { id: 'c4-3', title: 'מרתון חזרות אחרון וטיפים טקטיים', status: 'not_started', estimatedHours: 16, completedHours: 0 }
          ]
     }
];

export const INITIAL_TASKS: DailyTask[] = [
     {
          id: 't1',
          topic: 'אינטגרלים בשיטת ההצבה והחלקים',
          subject: 'מתמטיקה 5 יח״ל',
          durationMinutes: 45,
          type: 'למידה ראשונית',
          status: 'pending',
          dueDate: '2026-08-28',
          isToday: true
     },
     {
          id: 't2',
          topic: 'תרגול 15 שאלות בגרות בנושא חקירת פונקציית מעריכית',
          subject: 'מתמטיקה 5 יח״ל',
          durationMinutes: 60,
          type: 'תרגול שאלות',
          status: 'pending',
          dueDate: '2026-08-28',
          isToday: true
     },
     {
          id: 't3',
          topic: 'חזרה מרווחת: משפטי הגיאומטריה הלוחצים - מעגלים',
          subject: 'מתמטיקה 5 יח״ל',
          durationMinutes: 30,
          type: 'חזרה מרווחת',
          status: 'pending',
          dueDate: '2026-08-28',
          isToday: true
     },
     {
          id: 't4',
          topic: 'פתרון פרק מילולי בזמן אמת (20 דק\')',
          subject: 'פסיכומטרי',
          durationMinutes: 45,
          type: 'תרגול שאלות',
          status: 'completed',
          dueDate: '2026-08-27',
          isToday: false
     }
];

export const INITIAL_EXCEPTIONS: ExceptionDate[] = [
     {
          id: 'e1',
          date: '2026-09-12',
          reason: 'אימון מילואים יחידתי',
          category: 'מילואים'
     },
     {
          id: 'e2',
          date: '2026-09-24',
          reason: 'חתונה משפחתית בצפון',
          category: 'אירוע אישי'
     }
];
