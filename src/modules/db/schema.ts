/**
 * Core Data Models, Entities & Schema Definitions
 * Subagent 1: Architecture & Database Design
 */

export interface UserRecord {
	id: string;
	email?: string;
	name?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SubjectGradeRecord {
	id: string;
	profileId: string;
	subjectName: string;
	units: number;
	grade: number;
	isMandatory: boolean;
	isMath?: boolean;
	isPhysics?: boolean;
	coefficientBonus?: number;
}

export interface UserAcademicProfileRecord {
	userId: string;
	bagrutSubjects: SubjectGradeRecord[];
	mathUnits: number;
	mathGrade: number;
	physicsUnits: number;
	physicsGrade: number;
	psychometricGeneral: number;
	psychometricQuant: number;
	psychometricVerbal: number;
	psychometricEnglish: number;
	hasTakenPsychometric: boolean;
	estimatedBagrutAverage?: number;
	updatedAt: Date;
}

export interface UserPreferencesRecord {
	userId: string;
	psychExperience: 'never' | 'once' | 'multiple';
	psychFeeling: 'high_potential' | 'low_confidence' | 'neutral';
	psychStrongestSection: 'quant' | 'verbal' | 'english' | 'balanced';
	learningOrientation: 'stem' | 'humanities' | 'flexible';
	learningStrength: 'analytical_quick' | 'memory_retention' | 'deep_accuracy_no_rush';
	weeklyAvailabilityHours: 'limited_under_15' | 'part_15_25' | 'full_30_plus';
	targetTimeline: 'immediate_october' | 'next_year' | 'flexible';
	updatedAt: Date;
}

export type SekemType = 'general' | 'engineering' | 'management' | 'technion';

export interface ProgramPrerequisites {
	minMathUnits?: number;
	minMathGrade?: number;
	minPhysUnits?: number;
	minPhysGrade?: number;
	mustHavePsychometric: boolean;
	mandatorySubjects?: string[];
}

export interface AcademicProgramRecord {
	id: string;
	institutionId: string;
	institutionName: string;
	facultyName: string;
	name: string;
	fieldOfStudy: string;
	degreeLevel: 'bachelor' | 'master' | 'other';
	minSekemThreshold: number;
	relevantSekemType: SekemType;
	directBagrutEligible: boolean;
	directBagrutMinAverage?: number | null;
	prerequisites: ProgramPrerequisites;
	url?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface InstitutionRecord {
	id: string;
	name: string;
	calculatorId: string;
	websiteUrl: string;
	isUniversity: boolean;
	defaultMinBagrutUnits: number;
}

export type FeasibilityLevel = 'very_high' | 'high' | 'moderate' | 'challenging';

export interface ImprovementLeverRecord {
	id: string;
	trackId: string;
	subjectName: string;
	currentGrade: number;
	currentUnits: number;
	targetGrade: number;
	targetUnits: number;
	priority: number;
	reason: string;
	isMath?: boolean;
	isPhysics?: boolean;
	leverType: 'psychometric' | 'bagrut_core' | 'bagrut_elective';
}

export interface TrackMilestoneRecord {
	id: string;
	trackId: string;
	orderIndex: number;
	title: string;
	detail: string;
	timing: string;
	type: 'psychometric' | 'bagrut_core' | 'bagrut_elective' | 'administrative';
}

export interface ActionTrackRecord {
	id: string;
	userId: string;
	programId: string;
	title: string;
	badge: string;
	badgeColor: string;
	strategyDescription: string;
	targetSekem?: number;
	targetPsychometric?: number;
	currentPsychometric?: number;
	targetBagrutAverage?: number;
	currentBagrutAverage?: number;
	recommendedLevers: ImprovementLeverRecord[];
	milestones: TrackMilestoneRecord[];
	estimatedWeeks: number;
	weeklyHours: number;
	feasibility: FeasibilityLevel;
	feasibilityExplanation: string;
	keyAdvantage: string;
	createdAt: Date;
}

/**
 * Declarative Prisma Schema Definition for PostgreSQL / SQLite production migration
 */
export const PRISMA_SCHEMA_DEFINITION = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  profile     UserAcademicProfile?
  preferences UserPreferences?
  tracks      ActionTrack[]
}

model UserAcademicProfile {
  userId               String   @id
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mathUnits            Int      @default(4)
  mathGrade            Float    @default(80)
  physicsUnits         Int      @default(0)
  physicsGrade         Float    @default(0)
  psychometricGeneral  Int      @default(0)
  psychometricQuant    Int      @default(0)
  psychometricVerbal   Int      @default(0)
  psychometricEnglish  Int      @default(0)
  hasTakenPsychometric Boolean  @default(false)
  updatedAt            DateTime @updatedAt

  subjects SubjectGrade[]
}

model SubjectGrade {
  id          String              @id @default(uuid())
  profileId   String
  profile     UserAcademicProfile @relation(fields: [profileId], references: [userId], onDelete: Cascade)
  subjectName String
  units       Int
  grade       Float
  isMandatory Boolean             @default(false)
  isMath      Boolean             @default(false)
  isPhysics   Boolean             @default(false)
}

model Institution {
  id                    String            @id
  name                  String
  calculatorId          String
  websiteUrl            String
  isUniversity          Boolean           @default(true)
  defaultMinBagrutUnits Int               @default(20)
  programs              AcademicProgram[]
}

model AcademicProgram {
  id                     String      @id
  institutionId          String
  institution            Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  facultyName            String
  name                   String
  fieldOfStudy           String
  degreeLevel            String      @default("bachelor")
  minSekemThreshold      Float
  relevantSekemType      String      @default("general")
  directBagrutEligible   Boolean     @default(false)
  directBagrutMinAverage Float?
  prerequisitesJson      Json?
  url                    String?
  createdAt              DateTime    @default(now())
  updatedAt              DateTime    @updatedAt

  tracks ActionTrack[]

  @@index([institutionId])
  @@index([fieldOfStudy])
  @@index([minSekemThreshold])
}

model ActionTrack {
  id                     String          @id @default(uuid())
  userId                 String
  user                   User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  programId              String
  program                AcademicProgram @relation(fields: [programId], references: [id], onDelete: Cascade)
  title                  String
  badge                  String
  badgeColor             String
  strategyDescription    String
  targetSekem            Float?
  targetPsychometric     Int?
  targetBagrutAverage    Float?
  estimatedWeeks         Int
  weeklyHours            Int
  feasibility            String
  feasibilityExplanation String
  keyAdvantage           String
  createdAt              DateTime        @default(now())

  levers     ImprovementLever[]
  milestones TrackMilestone[]

  @@index([userId, programId])
}

model ImprovementLever {
  id           String      @id @default(uuid())
  trackId      String
  track        ActionTrack @relation(fields: [trackId], references: [id], onDelete: Cascade)
  subjectName  String
  currentGrade Float
  currentUnits Int
  targetGrade  Float
  targetUnits  Int
  priority     Int
  reason       String
  leverType    String
}

model TrackMilestone {
  id         String      @id @default(uuid())
  trackId    String
  track      ActionTrack @relation(fields: [trackId], references: [id], onDelete: Cascade)
  orderIndex Int
  title      String
  detail     String
  timing     String
  type       String
}
`;
