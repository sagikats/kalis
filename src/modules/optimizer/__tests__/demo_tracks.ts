/**
 * Demo script: print actual generated tracks for each of the 8 audit cases
 * Run with: npx tsx src/modules/optimizer/__tests__/demo_tracks.ts
 */

import {
	generateOptimizedActionTracks
} from '../index';

import { AcademicProgramRecord, UserAcademicProfileRecord, UserPreferencesRecord } from '../../db/schema';

const defaultPrefs: UserPreferencesRecord = {
	userId: 'demo',
	psychExperience: 'never',
	psychFeeling: 'neutral',
	psychStrongestSection: 'balanced',
	learningOrientation: 'flexible',
	learningStrength: 'analytical_quick',
	weeklyAvailabilityHours: 'part_15_25',
	targetTimeline: 'flexible',
	updatedAt: new Date()
};

function prog(o: Partial<AcademicProgramRecord>): AcademicProgramRecord {
	return {
		id: 'demo', institutionId: 'bgu', institutionName: 'בן-גוריון',
		facultyName: 'כללי', name: 'תוכנית', fieldOfStudy: 'כללי',
		degreeLevel: 'bachelor', minSekemThreshold: 650, relevantSekemType: 'general',
		directBagrutEligible: false, directBagrutMinAverage: null,
		prerequisites: { mustHavePsychometric: false },
		createdAt: new Date(), updatedAt: new Date(), ...o
	};
}

interface CaseInput {
	title: string;
	profile: UserAcademicProfileRecord;
	program: AcademicProgramRecord;
	prefs?: UserPreferencesRecord;
}

const cases: CaseInput[] = [
	{
		title: 'מקרה 1: טכניון — מדעי המחשב (חובה פסיכומטרי)',
		profile: {
			userId: 'c1', bagrutSubjects: [
				{ id:'1',profileId:'c1',subjectName:'מתמטיקה',units:5,grade:85,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c1',subjectName:'אנגלית',units:5,grade:90,isMandatory:true },
				{ id:'3',profileId:'c1',subjectName:'פיזיקה',units:5,grade:80,isMandatory:false,isPhysics:true },
				{ id:'4',profileId:'c1',subjectName:'מדעי המחשב',units:5,grade:92,isMandatory:false },
				{ id:'5',profileId:'c1',subjectName:'ספרות',units:2,grade:85,isMandatory:true },
				{ id:'6',profileId:'c1',subjectName:'היסטוריה',units:2,grade:85,isMandatory:true },
				{ id:'7',profileId:'c1',subjectName:'תנ״ך',units:2,grade:85,isMandatory:true },
				{ id:'8',profileId:'c1',subjectName:'אזרחות',units:2,grade:85,isMandatory:true },
			],
			mathUnits:5,mathGrade:85,physicsUnits:5,physicsGrade:80,
			psychometricGeneral:680,psychometricQuant:135,psychometricVerbal:125,psychometricEnglish:130,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'technion',institutionName:'הטכניון',name:'מדעי המחשב',
			fieldOfStudy:'מדעי המחשב',minSekemThreshold:91,relevantSekemType:'technion',
			directBagrutEligible:false,prerequisites:{mustHavePsychometric:true} })
	},
	{
		title: 'מקרה 2: עברית — פסיכולוגיה (בגרות ישירה, פסיכומטרי נמוך)',
		profile: {
			userId: 'c2', bagrutSubjects: [
				{ id:'1',profileId:'c2',subjectName:'מתמטיקה',units:4,grade:90,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c2',subjectName:'אנגלית',units:5,grade:95,isMandatory:true },
				{ id:'3',profileId:'c2',subjectName:'ספרות עברית',units:5,grade:95,isMandatory:false },
				{ id:'4',profileId:'c2',subjectName:'היסטוריה',units:2,grade:88,isMandatory:true },
				{ id:'5',profileId:'c2',subjectName:'תנ״ך',units:2,grade:88,isMandatory:true },
				{ id:'6',profileId:'c2',subjectName:'אזרחות',units:2,grade:88,isMandatory:true },
				{ id:'7',profileId:'c2',subjectName:'הבעה עברית',units:2,grade:90,isMandatory:true },
			],
			mathUnits:4,mathGrade:90,physicsUnits:0,physicsGrade:0,
			psychometricGeneral:550,psychometricQuant:110,psychometricVerbal:110,psychometricEnglish:110,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'huji',institutionName:'האוניברסיטה העברית',name:'פסיכולוגיה',
			fieldOfStudy:'פסיכולוגיה',minSekemThreshold:660,relevantSekemType:'general',
			directBagrutEligible:true,directBagrutMinAverage:105 }),
		prefs: { ...defaultPrefs, weeklyAvailabilityHours:'full_30_plus' }
	},
	{
		title: 'מקרה 3: תל אביב — הנדסת חשמל (4 יח״ל מתמטיקה)',
		profile: {
			userId: 'c3', bagrutSubjects: [
				{ id:'1',profileId:'c3',subjectName:'מתמטיקה',units:4,grade:92,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c3',subjectName:'אנגלית',units:5,grade:88,isMandatory:true },
				{ id:'3',profileId:'c3',subjectName:'פיזיקה',units:5,grade:82,isMandatory:false,isPhysics:true },
				{ id:'4',profileId:'c3',subjectName:'ספרות',units:2,grade:80,isMandatory:true },
				{ id:'5',profileId:'c3',subjectName:'היסטוריה',units:2,grade:80,isMandatory:true },
				{ id:'6',profileId:'c3',subjectName:'תנ״ך',units:2,grade:80,isMandatory:true },
				{ id:'7',profileId:'c3',subjectName:'אזרחות',units:2,grade:80,isMandatory:true },
			],
			mathUnits:4,mathGrade:92,physicsUnits:5,physicsGrade:82,
			psychometricGeneral:670,psychometricQuant:130,psychometricVerbal:125,psychometricEnglish:130,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'tau',institutionName:'אוניברסיטת תל אביב',name:'הנדסת חשמל',
			fieldOfStudy:'הנדסה',minSekemThreshold:720,relevantSekemType:'engineering',
			directBagrutEligible:false }),
		prefs: { ...defaultPrefs, learningOrientation:'stem', learningStrength:'analytical_quick' }
	},
	{
		title: 'מקרה 4: בן-גוריון — כלכלה וחברה (מדעי הרוח)',
		profile: {
			userId: 'c4', bagrutSubjects: [
				{ id:'1',profileId:'c4',subjectName:'מתמטיקה',units:4,grade:75,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c4',subjectName:'אנגלית',units:5,grade:85,isMandatory:true },
				{ id:'3',profileId:'c4',subjectName:'היסטוריה',units:2,grade:78,isMandatory:true },
				{ id:'4',profileId:'c4',subjectName:'תנ״ך',units:2,grade:75,isMandatory:true },
				{ id:'5',profileId:'c4',subjectName:'אזרחות',units:2,grade:80,isMandatory:true },
				{ id:'6',profileId:'c4',subjectName:'ספרות',units:2,grade:77,isMandatory:true },
			],
			mathUnits:4,mathGrade:75,physicsUnits:0,physicsGrade:0,
			psychometricGeneral:620,psychometricQuant:120,psychometricVerbal:125,psychometricEnglish:120,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'bgu',institutionName:'בן-גוריון',name:'כלכלה וחברה',
			fieldOfStudy:'כלכלה',minSekemThreshold:650,relevantSekemType:'general',
			directBagrutEligible:false }),
		prefs: { ...defaultPrefs, learningOrientation:'humanities', learningStrength:'memory_retention' }
	},
	{
		title: 'מקרה 5: חיפה — משפטים (פסיכומטרי נמוך, פער גדול)',
		profile: {
			userId: 'c5', bagrutSubjects: [
				{ id:'1',profileId:'c5',subjectName:'מתמטיקה',units:4,grade:78,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c5',subjectName:'אנגלית',units:5,grade:80,isMandatory:true },
				{ id:'3',profileId:'c5',subjectName:'ספרות',units:2,grade:75,isMandatory:true },
				{ id:'4',profileId:'c5',subjectName:'היסטוריה',units:2,grade:72,isMandatory:true },
				{ id:'5',profileId:'c5',subjectName:'תנ״ך',units:2,grade:70,isMandatory:true },
				{ id:'6',profileId:'c5',subjectName:'אזרחות',units:2,grade:74,isMandatory:true },
			],
			mathUnits:4,mathGrade:78,physicsUnits:0,physicsGrade:0,
			psychometricGeneral:580,psychometricQuant:116,psychometricVerbal:116,psychometricEnglish:116,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'haifa',institutionName:'אוניברסיטת חיפה',name:'משפטים',
			fieldOfStudy:'משפטים',minSekemThreshold:700,relevantSekemType:'general',
			directBagrutEligible:false })
	},
	{
		title: 'מקרה 6: בר-אילן — מדעי הנתונים (3 יח״ל מתמטיקה)',
		profile: {
			userId: 'c6', bagrutSubjects: [
				{ id:'1',profileId:'c6',subjectName:'מתמטיקה',units:3,grade:95,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c6',subjectName:'אנגלית',units:5,grade:90,isMandatory:true },
				{ id:'3',profileId:'c6',subjectName:'ספרות',units:2,grade:85,isMandatory:true },
				{ id:'4',profileId:'c6',subjectName:'היסטוריה',units:2,grade:82,isMandatory:true },
				{ id:'5',profileId:'c6',subjectName:'תנ״ך',units:2,grade:82,isMandatory:true },
				{ id:'6',profileId:'c6',subjectName:'אזרחות',units:2,grade:84,isMandatory:true },
			],
			mathUnits:3,mathGrade:95,physicsUnits:0,physicsGrade:0,
			psychometricGeneral:680,psychometricQuant:136,psychometricVerbal:128,psychometricEnglish:132,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'bar_ilan',institutionName:'בר-אילן',name:'מדעי הנתונים',
			fieldOfStudy:'מדעי המחשב',minSekemThreshold:660,relevantSekemType:'general',
			directBagrutEligible:false }),
		prefs: { ...defaultPrefs, learningOrientation:'stem', learningStrength:'analytical_quick' }
	},
	{
		title: 'מקרה 7: רייכמן — מועמד גבולי (binary search)',
		profile: {
			userId: 'c7', bagrutSubjects: [
				{ id:'1',profileId:'c7',subjectName:'מתמטיקה',units:4,grade:80,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c7',subjectName:'אנגלית',units:4,grade:82,isMandatory:true },
				{ id:'3',profileId:'c7',subjectName:'ספרות',units:2,grade:78,isMandatory:true },
				{ id:'4',profileId:'c7',subjectName:'היסטוריה',units:2,grade:76,isMandatory:true },
				{ id:'5',profileId:'c7',subjectName:'תנ״ך',units:2,grade:77,isMandatory:true },
				{ id:'6',profileId:'c7',subjectName:'אזרחות',units:2,grade:79,isMandatory:true },
			],
			mathUnits:4,mathGrade:80,physicsUnits:0,physicsGrade:0,
			psychometricGeneral:580,psychometricQuant:116,psychometricVerbal:116,psychometricEnglish:116,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'reichman',institutionName:'אוניברסיטת רייכמן',name:'מנהל עסקים',
			fieldOfStudy:'ניהול',minSekemThreshold:600,relevantSekemType:'general',
			directBagrutEligible:false })
	},
	{
		title: 'מקרה 8: בן-גוריון — מועמד עם 21 יח״ל (חוק 20 יחידות)',
		profile: {
			userId: 'c8', bagrutSubjects: [
				{ id:'1',profileId:'c8',subjectName:'מתמטיקה',units:4,grade:82,isMandatory:true,isMath:true },
				{ id:'2',profileId:'c8',subjectName:'אנגלית',units:4,grade:80,isMandatory:true },
				{ id:'3',profileId:'c8',subjectName:'ספרות',units:2,grade:75,isMandatory:true },
				{ id:'4',profileId:'c8',subjectName:'היסטוריה',units:2,grade:73,isMandatory:true },
				{ id:'5',profileId:'c8',subjectName:'תנ״ך',units:2,grade:72,isMandatory:true },
				{ id:'6',profileId:'c8',subjectName:'אזרחות',units:2,grade:74,isMandatory:true },
				{ id:'7',profileId:'c8',subjectName:'ביולוגיה',units:5,grade:77,isMandatory:false },
			],
			mathUnits:4,mathGrade:82,physicsUnits:0,physicsGrade:0,
			psychometricGeneral:610,psychometricQuant:122,psychometricVerbal:122,psychometricEnglish:118,
			hasTakenPsychometric:true, updatedAt:new Date()
		},
		program: prog({ institutionId:'bgu',institutionName:'בן-גוריון',name:'מדעי הטבע',
			fieldOfStudy:'מדעים',minSekemThreshold:630,relevantSekemType:'general',
			directBagrutEligible:false })
	},
];

const TRACK_ICONS: Record<string, string> = {
	'track-maximize-exam': '🎯',
	'track-risk-spread':   '🛡️',
	'track-fast-psych':    '⚡',
	'track-direct-bagrut': '🎓',
	'track-balanced':      '⚖️',
	'track-anchor':        '⚓',
};

for (const c of cases) {
	const prefs = c.prefs ?? defaultPrefs;
	const sol = generateOptimizedActionTracks(c.program, c.profile, prefs);

	console.log('\n' + '═'.repeat(70));
	console.log(`📋  ${c.title}`);
	console.log(`    מוסד: ${c.program.institutionName} | תוכנית: ${c.program.name}`);
	console.log(`    סף קבלה: ${c.program.minSekemThreshold} | בגרות ישירה אפשרית: ${sol.hasDirectBagrutOption ? '✅' : '❌'} | מכינה זמינה (Opt-In): ${sol.mechinaAvailable ? '✅' : '❌'}`);
	console.log(`    מסלולים שנוצרו: ${sol.tracks.length}`);
	console.log('─'.repeat(70));

	for (const t of sol.tracks) {
		const icon = TRACK_ICONS[t.id] ?? '📍';
		console.log(`\n  ${icon}  ${t.title}`);
		console.log(`     Badge: ${t.badge}`);
		console.log(`     סכם יעד: ${t.targetSekem?.toFixed(1) ?? '—'} | ממוצע בגרות: ${t.targetBagrutAverage?.toFixed(1) ?? '—'}`);
		if (t.targetPsychometric) {
			const delta = t.targetPsychometric - (c.profile.psychometricGeneral ?? 0);
			console.log(`     פסיכומטרי יעד: ${t.targetPsychometric} (${delta >= 0 ? '+' : ''}${delta} מהנוכחי ${c.profile.psychometricGeneral})`);
		} else {
			console.log(`     פסיכומטרי יעד: אין (בגרות ישירה / מכינה)`);
		}
		console.log(`     ישימות: ${t.feasibility} | שבועות משוערים: ${t.estimatedWeeks}`);
		console.log(`     אסטרטגיה: ${t.strategyDescription?.slice(0, 120)}...`);
		if (t.recommendedLevers.length > 0) {
			const leverStr = t.recommendedLevers.map(l => `${l.subjectName}→${l.targetGrade}(${l.targetUnits}יח״ל)`).join(', ');
			console.log(`     מנופים: ${leverStr}`);
		}
	}
}

console.log('\n' + '═'.repeat(70));
console.log('✅  סיום הדגמת מסלולים לכל 8 מקרי הבוחן');
