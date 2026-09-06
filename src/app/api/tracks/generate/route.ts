import { NextRequest, NextResponse } from 'next/server';
import { dbRepository, GenerateTracksRequestSchema, UserAcademicProfileRecord, UserPreferencesRecord } from '@/modules/db';
import { generateOptimizedActionTracks } from '@/modules/optimizer';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parseResult = GenerateTracksRequestSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					success: false,
					error: 'ולידציית קלט נכשלה',
					details: parseResult.error.flatten()
				},
				{ status: 400 }
			);
		}

		const { programId, profile, preferences } = parseResult.data;

		const program = dbRepository.findProgramById(programId);
		if (!program) {
			return NextResponse.json(
				{
					success: false,
					error: `חוג הלימודים המבוקש לא נמצא (מזהה: ${programId})`
				},
				{ status: 404 }
			);
		}

		const userId = profile.userId || 'guest_user';

		const profileRecord: UserAcademicProfileRecord = {
			userId,
			bagrutSubjects: profile.bagrutSubjects.map((s, idx) => ({
				id: `sub_${idx}`,
				profileId: userId,
				subjectName: s.name,
				units: s.units,
				grade: s.grade,
				isMandatory: false,
				isMath: s.name.includes('מתמטיקה'),
				isPhysics: s.name.includes('פיזיקה')
			})),
			mathUnits: profile.mathUnits,
			mathGrade: profile.mathGrade,
			physicsUnits: profile.physicsUnits,
			physicsGrade: profile.physicsGrade,
			psychometricGeneral: profile.psychometricGeneral,
			psychometricQuant: profile.psychometricQuant,
			psychometricVerbal: profile.psychometricVerbal,
			psychometricEnglish: profile.psychometricEnglish,
			hasTakenPsychometric: profile.hasTakenPsychometric,
			updatedAt: new Date()
		};

		const preferencesRecord: UserPreferencesRecord = {
			userId,
			psychExperience: preferences?.psychExperience || 'never',
			psychFeeling: preferences?.psychFeeling || 'neutral',
			psychStrongestSection: preferences?.psychStrongestSection || 'balanced',
			learningOrientation: preferences?.learningOrientation || 'flexible',
			learningStrength: preferences?.learningStrength || 'analytical_quick',
			weeklyAvailabilityHours: preferences?.weeklyAvailabilityHours || 'part_15_25',
			targetTimeline: preferences?.targetTimeline || 'flexible',
			updatedAt: new Date()
		};

		const solution = generateOptimizedActionTracks(program, profileRecord, preferencesRecord);

		// Persist solution in repository
		dbRepository.saveUserProfile(profileRecord);
		dbRepository.saveUserPreferences(preferencesRecord);
		dbRepository.saveActionTracks(userId, programId, solution.tracks);

		return NextResponse.json({
			success: true,
			program,
			solution
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'שגיאה פנימית בהפקת מסלולי הקבלה'
			},
			{ status: 500 }
		);
	}
}
