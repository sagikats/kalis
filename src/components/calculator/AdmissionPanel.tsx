'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2, AlertCircle, XCircle, GraduationCap } from 'lucide-react';
import type { AdmissionRoutes } from '@/types/academic';
import type { SubjectInput } from '@/modules/calculators';
import { evaluateProgramRequirements, UserAcademicProfile } from '@/utils/analysis/gapAnalyzer';
import { isBlocking } from '@/modules/optimizer/programRequirements';
import { isSameBagrutSubject } from '@/modules/optimizer/solver';

/** The calculator inputs the official conditions are checked against. */
export type AdmissionPanelProfile = UserAcademicProfile;

export function toPanelProfile(subjects: SubjectInput[], general: number | '', quant: number | '', verbal: number | '', english: number | ''): AdmissionPanelProfile {
  const valid = subjects.filter((s) => s.units > 0 && s.grade > 0);
  const math = valid.find((s) => isSameBagrutSubject(s.name, 'מתמטיקה'));
  const physics = valid.find((s) => isSameBagrutSubject(s.name, 'פיזיקה'));
  return {
    bagrutSubjects: valid,
    psychometricGeneral: Number(general) || 0,
    psychometricQuant: Number(quant) || 0,
    psychometricVerbal: Number(verbal) || 0,
    psychometricEnglish: Number(english) || 0,
    mathUnits: math?.units ?? 0,
    mathGrade: math?.grade ?? 0,
    physicsUnits: physics?.units ?? 0,
    physicsGrade: physics?.grade ?? 0
  };
}

type RawInstitution = { id: string; name: string; programs: Program[] };

// The raw catalog (~1.9MB, includes programs without a numeric threshold) is loaded as a lazy
// chunk the first time the panel opens, so it stays out of the /calculators page bundle.
let rawCatalogPromise: Promise<RawInstitution[]> | null = null;
function loadRawCatalog(): Promise<RawInstitution[]> {
  if (!rawCatalogPromise) {
    rawCatalogPromise = import('@/data/academicData.json')
      .then((m) => Object.values(m.default) as RawInstitution[])
      .catch((err) => {
        rawCatalogPromise = null;
        throw err;
      });
  }
  return rawCatalogPromise;
}

const INST_ID_MAP: Record<string, string> = {
  bgu: 'inst-3',
  tau: 'inst-6',
  huji: 'inst-1',
  technion: 'inst-48',
  ariel: 'inst-2',
  haifa: 'inst-5',
  bar_ilan: 'inst-4',
  reichman: 'inst-38'
};

interface Program {
  id: string;
  fieldOfStudy: string;
  degreeLevel: string;
  admissionThreshold: number | string;
  psychometricScore?: number | string;
  comments?: string;
  admissionRoutes?: AdmissionRoutes;
}

/** Same meaning as the admission report: missing_requirement = the sekem passes but an official condition is missing. */
type AdmissionStatus = 'accepted' | 'missing_requirement' | 'not_accepted' | 'no_threshold';

interface ProgramResult {
  program: Program;
  status: AdmissionStatus;
  threshold: number | null;
  gap: number;
  /** Official conditions the applicant doesn't meet (titles), when the sekem passes. */
  missing: string[];
}

interface AdmissionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  institutionName: string;
  userGeneralSekem: number;
  userEngineeringSekem?: number;
  userManagementSekem?: number;
  bagrutAverage?: number;
  profile?: AdmissionPanelProfile;
}

function parseThreshold(raw: number | string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number') return isNaN(raw) ? null : raw;
  const n = parseInt(String(raw), 10);
  return isNaN(n) ? null : n;
}

/** Official conditions not met: the minimum psychometric and blocking subject/English requirements. */
function missingConditions(routes: AdmissionRoutes | undefined, profile: AdmissionPanelProfile | undefined): string[] {
  if (!routes || !profile) return [];
  const missing: string[] = [];
  if (routes.minPsychometric && (profile.psychometricGeneral || 0) < routes.minPsychometric) {
    missing.push(`פסיכומטרי ${routes.minPsychometric}`);
  }
  for (const r of evaluateProgramRequirements(routes.requirements, profile)) {
    if (isBlocking(r)) missing.push(r.requirement.title);
  }
  return missing;
}

function classifyStatus(gap: number | null, missing: string[]): AdmissionStatus {
  if (gap === null) return 'no_threshold';
  if (gap < 0) return 'not_accepted';
  return missing.length > 0 ? 'missing_requirement' : 'accepted';
}

export default function AdmissionPanel({
  isOpen,
  onClose,
  institutionId,
  institutionName,
  userGeneralSekem,
  userEngineeringSekem,
  userManagementSekem,
  profile,
}: AdmissionPanelProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const [catalog, setCatalog] = useState<RawInstitution[] | null>(null);
  useEffect(() => {
    if (!isOpen || catalog) return;
    let isMounted = true;
    loadRawCatalog()
      .then((data) => { if (isMounted) setCatalog(data); })
      .catch(() => { if (isMounted) setCatalog([]); });
    return () => { isMounted = false; };
  }, [isOpen, catalog]);

  const isTechnion = institutionId === 'technion';
  const defaultEffectiveSekem =
    userEngineeringSekem && userEngineeringSekem > userGeneralSekem
      ? userEngineeringSekem
      : userGeneralSekem;

  const programs: ProgramResult[] = useMemo(() => {
    const dataKey = INST_ID_MAP[institutionId];
    if (!dataKey || !catalog) return [];
    const institution = catalog.find(i => i.id === dataKey);
    if (!institution) return [];

    return institution.programs.map((prog): ProgramResult => {
      const threshold = parseThreshold(prog.admissionThreshold);

      let programSekem = defaultEffectiveSekem;
      if (institutionId === 'tau') {
        const title = prog.fieldOfStudy;
        const isManagement = (title.includes('ניהול') || title.includes('חשבונאות') || title.includes('מנהל עסקים')) && !title.includes('הנדס');
        const isEngineering = title.includes('הנדס') || title.includes('מדעי המחשב') || title.includes('פיזיקה') || title.includes('כימיה') || title.includes('מתמטיקה') || title.includes('מדעים מדויקים');

        if (isManagement && userManagementSekem) {
          programSekem = userManagementSekem;
        } else if (isEngineering && userEngineeringSekem) {
          programSekem = userEngineeringSekem;
        } else {
          programSekem = userGeneralSekem;
        }
      }

      const gap = threshold !== null ? programSekem - threshold : null;
      const missing = gap !== null && gap >= 0 ? missingConditions(prog.admissionRoutes, profile) : [];
      const status = classifyStatus(gap, missing);
      return { program: prog, status, threshold, gap: gap ?? 0, missing };
    });
  }, [catalog, institutionId, defaultEffectiveSekem, userGeneralSekem, userEngineeringSekem, userManagementSekem, profile]);

  const sorted = useMemo(() => {
    const order: Record<AdmissionStatus, number> = {
      accepted: 0, missing_requirement: 1, no_threshold: 2, not_accepted: 3,
    };
    return [...programs].sort((a, b) => {
      const orderDiff = order[a.status] - order[b.status];
      if (orderDiff !== 0) return orderDiff;
      if (a.threshold !== null && b.threshold !== null) return b.threshold - a.threshold;
      return 0;
    });
  }, [programs]);

  const validThresholds = programs.filter(p => p.threshold !== null);
  const minThreshold = validThresholds.length ? Math.min(...validThresholds.map(p => p.threshold!)) : 0;
  const maxThreshold = validThresholds.length ? Math.max(...validThresholds.map(p => p.threshold!)) : 1;
  const thresholdRange = maxThreshold - minThreshold || 1;

  function getBarWidth(threshold: number | null): string {
    if (threshold === null) return '40%';
    const pct = ((threshold - minThreshold) / thresholdRange) * 80 + 10;
    return `${Math.max(10, Math.min(100, pct))}%`;
  }

  const acceptedCount = programs.filter(p => p.status === 'accepted').length;
  const missingRequirementCount = programs.filter(p => p.status === 'missing_requirement').length;
  const auditionCount = programs.filter(p => p.status === 'no_threshold').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#222222]/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-[#FAF8F5] border-l border-[#E5DFD4] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5DFD4] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#222222]">{institutionName}</h2>
              <p className="text-[11px] text-[#66635C]">
                {isTechnion ? 'סכם טכניוני' : 'סכם כללי'}:{' '}
                <span className="text-[#222222] font-bold">{userGeneralSekem}</span>
                {!isTechnion && userEngineeringSekem && userEngineeringSekem !== userGeneralSekem && (
                  <span className="mr-2">
                    · הנדסה: <span className="text-[#222222] font-bold">{userEngineeringSekem}</span>
                  </span>
                )}
                {userManagementSekem && (
                  <span className="mr-2">
                    · ניהול: <span className="text-[#222222] font-bold">{userManagementSekem}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#66635C] hover:text-[#222222] hover:bg-[#FAF8F5] transition"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-[#F5F2EB] border-b border-[#E5DFD4] flex-wrap">
          <div className="flex items-center gap-1.5 text-[#205739]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{acceptedCount} התקבלת</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#825B15]">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{missingRequirementCount} חסר תנאי סף</span>
          </div>
          {auditionCount > 0 && (
            <div className="flex items-center gap-1.5 text-[#453D78]">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{auditionCount} קבלה נפרדת</span>
            </div>
          )}
          <span className="text-[11px] text-[#8A847C] mr-auto">{sorted.length} חוגים סה&quot;כ</span>
        </div>

        {/* Program List */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5">
          {!catalog && (
            <p className="text-center text-[#8A847C] text-sm py-12">טוען נתוני קבלה...</p>
          )}
          {catalog && sorted.length === 0 && (
            <p className="text-center text-[#8A847C] text-sm py-12">לא נמצאו נתוני קבלה</p>
          )}

          {sorted.map((item) => {
            const { program, status, threshold, gap, missing } = item;

            const cfg = {
              accepted: {
                icon: <CheckCircle2 className="h-4 w-4 text-[#205739] shrink-0" />,
                rowCls: 'border-[#C6DFCE] bg-[#EBF4EE]/80',
                nameCls: 'text-[#222222]',
                barCls: 'bg-[#205739]',
                gapLabel: gap > 0 ? `+${gap}` : '✓',
                gapCls: 'text-[#205739]',
              },
              missing_requirement: {
                icon: <AlertCircle className="h-4 w-4 text-[#825B15] shrink-0" />,
                rowCls: 'border-[#ECDAB6] bg-[#FDF6E8]/80',
                nameCls: 'text-[#222222]',
                barCls: 'bg-[#825B15]',
                gapLabel: 'חסר תנאי',
                gapCls: 'text-[#825B15]',
              },
              not_accepted: {
                icon: <XCircle className="h-4 w-4 text-[#9B3327]/60 shrink-0" />,
                rowCls: 'border-[#E5DFD4] bg-white',
                nameCls: 'text-[#66635C]',
                barCls: 'bg-[#9B3327]/30',
                gapLabel: String(gap),
                gapCls: 'text-[#9B3327]',
              },
              no_threshold: {
                icon: <GraduationCap className="h-4 w-4 text-[#453D78] shrink-0" />,
                rowCls: 'border-[#D2CEEB] bg-[#F2F1F8]/80',
                nameCls: 'text-[#222222]',
                barCls: 'bg-[#453D78]',
                gapLabel: 'אודישן',
                gapCls: 'text-[#453D78]',
              },
            }[status];

            return (
              <div
                key={program.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${cfg.rowCls} transition shadow-sm`}
              >
                {cfg.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold truncate ${cfg.nameCls}`}>
                      {program.fieldOfStudy}
                    </span>
                    <span className={`text-xs font-bold shrink-0 tabular-nums ${cfg.gapCls}`}>
                      {cfg.gapLabel}
                    </span>
                  </div>
                  {missing.length > 0 && (
                    <p className="text-[10px] font-medium text-[#825B15] mt-0.5">
                      הסכם עובר (+{gap}), חסר תנאי סף רשמי: {missing.join(', ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-[#E5DFD4] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.barCls}`}
                        style={{ width: getBarWidth(threshold) }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {threshold !== null && (
                        <span className="text-[10px] text-[#66635C]">סף {threshold}</span>
                      )}
                      <span className="text-[10px] text-[#8A847C] px-1.5 py-0.5 bg-white border border-[#E5DFD4] rounded-full">
                        {program.degreeLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer disclaimer */}
        <div className="px-5 py-3 border-t border-[#E5DFD4] bg-white">
          <p className="text-[10px] text-[#8A847C] text-center">
            הנתונים לצורך הערכה בלבד · יש לבדוק באתר האוניברסיטה
          </p>
        </div>
      </div>
    </>
  );
}
