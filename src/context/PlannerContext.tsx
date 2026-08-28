'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
     University,
     Degree,
     BagrutSubject,
     TrackId,
     DailyTask,
     CurriculumNode,
     ExceptionDate,
     PlannerState
} from '../types/planner';
import {
     INITIAL_CURRICULUM,
     INITIAL_TASKS,
     INITIAL_EXCEPTIONS,
     SYLLABUS_TOPICS_MATH_5
} from '../data/mockData';

interface PlannerContextType extends PlannerState {
     setTargetUniversity: (univ: University) => void;
     setTargetDegree: (degree: Degree) => void;
     setMathGrades: (units: number, grade: number) => void;
     setEnglishGrades: (units: number, grade: number) => void;
     setPsychometricScore: (score: number | null, hasPsych: boolean) => void;
     setSelectedTrack: (track: TrackId) => void;
     setWizardExamDetails: (subject: string, session: string, date: string) => void;
     setSelectedTopics: (topicIds: string[]) => void;
     setWeeklyAvailability: (grid: boolean[][]) => void;
     completeTask: (taskId: string) => void;
     deferTask: (taskId: string) => void;
     addTask: (task: Omit<DailyTask, 'id'>) => void;
     recalculateRoute: (reason?: string) => void;
     addException: (exception: Omit<ExceptionDate, 'id'>) => void;
     removeException: (id: string) => void;
     updateCurriculumNode: (id: string, status: CurriculumNode['status']) => void;
     clearRecalculationBanner: () => void;
}

const defaultAvailability = Array.from({ length: 7 }, () => Array(16).fill(true));

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
     const [targetUniversity, setTargetUniversity] = useState<University>('טכניון');
     const [targetDegree, setTargetDegree] = useState<Degree>('מדעי המחשב');
     const [mathUnits, setMathUnits] = useState<number>(4);
     const [mathGrade, setMathGrade] = useState<number>(88);
     const [englishUnits, setEnglishUnits] = useState<number>(5);
     const [englishGrade, setEnglishGrade] = useState<number>(92);
     const [expandedSubjects, setExpandedSubjects] = useState<BagrutSubject[]>([
          { id: 's1', name: 'פיזיקה', units: 5, grade: 85 }
     ]);
     const [psychometricScore, setPsychometricScoreState] = useState<number | null>(640);
     const [hasPsychometric, setHasPsychometric] = useState<boolean>(true);
     const [targetPsychometric, setTargetPsychometric] = useState<number>(700);
     const [selectedTrack, setSelectedTrackState] = useState<TrackId>('recommended');

     // Wizard
     const [subjectName, setSubjectName] = useState<string>('מתמטיקה 5 יח״ל');
     const [examSession, setExamSession] = useState<string>('קיץ 2026');
     const [examDate, setExamDate] = useState<string>('2026-06-18');
     const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
          SYLLABUS_TOPICS_MATH_5.map((t) => t.id)
     );
     const [totalPages, setTotalPages] = useState<number>(340);
     const [weeklyAvailability, setWeeklyAvailabilityState] = useState<boolean[][]>(defaultAvailability);

     // Dashboard & Schedule
     const [tasks, setTasks] = useState<DailyTask[]>(INITIAL_TASKS);
     const [curriculum, setCurriculum] = useState<CurriculumNode[]>(INITIAL_CURRICULUM);
     const [exceptions, setExceptions] = useState<ExceptionDate[]>(INITIAL_EXCEPTIONS);
     const [streakDays, setStreakDays] = useState<number>(14);
     const [recalculationPending, setRecalculationPending] = useState<boolean>(false);
     const [recalculationReason, setRecalculationReason] = useState<string | undefined>(undefined);

     const setMathGrades = (units: number, grade: number) => {
          setMathUnits(units);
          setMathGrade(grade);
     };

     const setEnglishGrades = (units: number, grade: number) => {
          setEnglishUnits(units);
          setEnglishGrade(grade);
     };

     const setPsychometricScore = (score: number | null, hasPsych: boolean) => {
          setPsychometricScoreState(score);
          setHasPsychometric(hasPsych);
     };

     const setSelectedTrack = (track: TrackId) => {
          setSelectedTrackState(track);
     };

     const setWizardExamDetails = (subject: string, session: string, date: string) => {
          setSubjectName(subject);
          setExamSession(session);
          setExamDate(date);
     };

     const setSelectedTopics = (topicIds: string[]) => {
          setSelectedTopicIds(topicIds);
     };

     const setWeeklyAvailability = (grid: boolean[][]) => {
          setWeeklyAvailabilityState(grid);
     };

     const completeTask = (taskId: string) => {
          setTasks((prev) =>
               prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
          );
     };

     const deferTask = (taskId: string) => {
          setTasks((prev) =>
               prev.map((t) => (t.id === taskId ? { ...t, status: 'deferred' } : t))
          );
          setRecalculationPending(true);
          setRecalculationReason('דחיית משימה יומית דורשת התאמת עומס סוף השבוע');
     };

     const addTask = (task: Omit<DailyTask, 'id'>) => {
          const newTask: DailyTask = {
               ...task,
               id: `task_${Date.now()}`
          };
          setTasks((prev) => [newTask, ...prev]);
     };

     const recalculateRoute = (reason?: string) => {
          // Generate an updated task sequence or recalculate task timeline
          setRecalculationPending(false);
          setRecalculationReason(undefined);

          // Boost completed hours in curriculum as a mock effect
          setCurriculum((prev) =>
               prev.map((node, idx) =>
                    idx === 0
                         ? {
                              ...node,
                              completedHours: Math.min(node.estimatedHours, node.completedHours + 2)
                         }
                         : node
               )
          );
     };

     const addException = (exception: Omit<ExceptionDate, 'id'>) => {
          const newEx: ExceptionDate = {
               ...exception,
               id: `ex_${Date.now()}`
          };
          setExceptions((prev) => [...prev, newEx]);
          setRecalculationPending(true);
          setRecalculationReason(`נוספה חסימת יומן: ${exception.reason}`);
     };

     const removeException = (id: string) => {
          setExceptions((prev) => prev.filter((e) => e.id !== id));
     };

     const updateCurriculumNode = (id: string, status: CurriculumNode['status']) => {
          const updateNodes = (nodes: CurriculumNode[]): CurriculumNode[] => {
               return nodes.map((node) => {
                    if (node.id === id) {
                         const completed =
                              status === 'reviewed'
                                   ? node.estimatedHours
                                   : status === 'practiced'
                                        ? Math.floor(node.estimatedHours * 0.8)
                                        : status === 'in_progress'
                                             ? Math.floor(node.estimatedHours * 0.4)
                                             : 0;
                         return { ...node, status, completedHours: completed };
                    }
                    if (node.subtopics) {
                         return { ...node, subtopics: updateNodes(node.subtopics) };
                    }
                    return node;
               });
          };
          setCurriculum((prev) => updateNodes(prev));
     };

     const clearRecalculationBanner = () => {
          setRecalculationPending(false);
          setRecalculationReason(undefined);
     };

     return (
          <PlannerContext.Provider
               value={{
                    targetUniversity,
                    targetDegree,
                    mathUnits,
                    mathGrade,
                    englishUnits,
                    englishGrade,
                    expandedSubjects,
                    psychometricScore,
                    hasPsychometric,
                    targetPsychometric,
                    selectedTrack,
                    subjectName,
                    examSession,
                    examDate,
                    selectedTopicIds,
                    totalPages,
                    weeklyAvailability,
                    tasks,
                    curriculum,
                    exceptions,
                    streakDays,
                    recalculationPending,
                    recalculationReason,
                    setTargetUniversity,
                    setTargetDegree,
                    setMathGrades,
                    setEnglishGrades,
                    setPsychometricScore,
                    setSelectedTrack,
                    setWizardExamDetails,
                    setSelectedTopics,
                    setWeeklyAvailability,
                    completeTask,
                    deferTask,
                    addTask,
                    recalculateRoute,
                    addException,
                    removeException,
                    updateCurriculumNode,
                    clearRecalculationBanner
               }}
          >
               {children}
          </PlannerContext.Provider>
     );
}

export function usePlanner() {
     const context = useContext(PlannerContext);
     if (!context) {
          throw new Error('usePlanner must be used within a PlannerProvider');
     }
     return context;
}
