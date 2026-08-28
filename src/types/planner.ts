export type University = 'טכניון' | 'אוניברסיטת תל אביב' | 'האוניברסיטה העברית' | 'אוניברסיטת בן-גוריון';

export type Degree = 'מדעי המחשב' | 'הנדסת חשמל' | 'רפואה' | 'משפטים' | 'פסיכולוגיה' | 'כלכלה';

export interface BagrutSubject {
  id: string;
  name: string;
  units: number;
  grade: number;
}

export type TrackId = 'recommended' | 'psychometric' | 'combined';

export interface AdmissionTrack {
  id: TrackId;
  title: string;
  subtitle: string;
  predictedSekem: number;
  thresholdSekem: number;
  hoursNeeded: number;
  difficulty: 'מומלץ - מקסימום ROI' | 'אינטנסיבי' | 'משולב ומתואם';
  difficultyColor: string;
  summaryText: string;
  actionPoints: string[];
}

export type TaskType = 'למידה ראשונית' | 'תרגול שאלות' | 'חזרה מרווחת' | 'סימולציה';

export interface DailyTask {
  id: string;
  topic: string;
  subject: string;
  durationMinutes: number;
  type: TaskType;
  status: 'pending' | 'completed' | 'deferred';
  dueDate: string;
  isToday: boolean;
}

export interface CurriculumNode {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'practiced' | 'reviewed';
  estimatedHours: number;
  completedHours: number;
  subtopics?: CurriculumNode[];
}

export interface ExceptionDate {
  id: string;
  date: string;
  reason: string;
  category: 'מילואים' | 'חופשה' | 'אירוע אישי' | 'אחר';
}

export interface PlannerState {
  targetUniversity: University;
  targetDegree: Degree;
  mathUnits: number;
  mathGrade: number;
  englishUnits: number;
  englishGrade: number;
  expandedSubjects: BagrutSubject[];
  psychometricScore: number | null;
  hasPsychometric: boolean;
  targetPsychometric: number;
  selectedTrack: TrackId;
  
  // Wizard State
  subjectName: string;
  examSession: string;
  examDate: string;
  selectedTopicIds: string[];
  totalPages: number;
  weeklyAvailability: boolean[][]; // 7 days (Sun-Sat) x 16 slots (8:00 - 24:00)
  
  // Dashboard & Schedule State
  tasks: DailyTask[];
  curriculum: CurriculumNode[];
  exceptions: ExceptionDate[];
  streakDays: number;
  recalculationPending: boolean;
  recalculationReason?: string;
}
