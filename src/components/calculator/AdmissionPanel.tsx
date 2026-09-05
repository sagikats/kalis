'use client';

import React, { useEffect, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, XCircle, GraduationCap } from 'lucide-react';
import academicData from '@/data/academicData.json';

const INST_ID_MAP: Record<string, string> = {
  bgu: 'inst-3',
  tau: 'inst-6',
  huji: 'inst-1',
  technion: 'inst-48',
  ariel: 'inst-2',
  haifa: 'inst-5',
};

interface Program {
  id: string;
  fieldOfStudy: string;
  degreeLevel: string;
  admissionThreshold: number | string;
  psychometricScore?: number | string;
  comments?: string;
}

type AdmissionStatus = 'accepted' | 'borderline' | 'not_accepted' | 'no_threshold';

interface ProgramResult {
  program: Program;
  status: AdmissionStatus;
  threshold: number | null;
  gap: number;
}

interface AdmissionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  institutionName: string;
  userGeneralSekem: number;
  userEngineeringSekem?: number;
  bagrutAverage?: number;
}

function parseThreshold(raw: number | string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number') return isNaN(raw) ? null : raw;
  const n = parseInt(String(raw), 10);
  return isNaN(n) ? null : n;
}

function classifyStatus(gap: number | null, borderlineRange = 20): AdmissionStatus {
  if (gap === null) return 'no_threshold';
  if (gap >= 0) return 'accepted';
  if (gap >= -borderlineRange) return 'borderline';
  return 'not_accepted';
}

export default function AdmissionPanel({
  isOpen,
  onClose,
  institutionId,
  institutionName,
  userGeneralSekem,
  userEngineeringSekem,
  bagrutAverage,
}: AdmissionPanelProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const isTechnion = institutionId === 'technion';
  const effectiveSekem =
    userEngineeringSekem && userEngineeringSekem > userGeneralSekem
      ? userEngineeringSekem
      : userGeneralSekem;

  const programs: ProgramResult[] = useMemo(() => {
    const dataKey = INST_ID_MAP[institutionId];
    if (!dataKey) return [];
    const all = Object.values(academicData) as { id: string; name: string; programs: Program[] }[];
    const institution = all.find(i => i.id === dataKey);
    if (!institution) return [];

    return institution.programs.map((prog): ProgramResult => {
      const threshold = parseThreshold(prog.admissionThreshold);
      const gap = threshold !== null ? effectiveSekem - threshold : null;
      const status = classifyStatus(gap, isTechnion ? 2 : 20);
      return { program: prog, status, threshold, gap: gap ?? 0 };
    });
  }, [institutionId, effectiveSekem, isTechnion]);

  const sorted = useMemo(() => {
    const order: Record<AdmissionStatus, number> = {
      accepted: 0, borderline: 1, no_threshold: 2, not_accepted: 3,
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
  const borderlineCount = programs.filter(p => p.status === 'borderline').length;
  const auditionCount = programs.filter(p => p.status === 'no_threshold').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel — slides from left (RTL layout) */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-slate-950 border-l border-slate-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <GraduationCap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">{institutionName}</h2>
              <p className="text-[11px] text-slate-400">
                {isTechnion ? 'סכם טכניוני' : 'סכם קבלה'}:{' '}
                <span className="text-cyan-300 font-bold">{effectiveSekem}</span>
                {!isTechnion && userEngineeringSekem && userEngineeringSekem !== userGeneralSekem && (
                  <span className="mr-2">
                    · הנדסה: <span className="text-indigo-300 font-bold">{userEngineeringSekem}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-900/50 border-b border-slate-800/60 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{acceptedCount} התקבלת</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{borderlineCount} על הגבול</span>
          </div>
          {auditionCount > 0 && (
            <div className="flex items-center gap-1.5 text-purple-400">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{auditionCount} קבלה נפרדת</span>
            </div>
          )}
          <span className="text-[11px] text-slate-600 mr-auto">{sorted.length} חוגים סה&quot;כ</span>
        </div>

        {/* Program List */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5">
          {sorted.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-12">לא נמצאו נתוני קבלה</p>
          )}

          {sorted.map((item) => {
            const { program, status, threshold, gap } = item;

            const cfg = {
              accepted: {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
                rowCls: 'border-emerald-500/20 bg-emerald-500/5',
                nameCls: 'text-slate-200',
                barCls: 'bg-emerald-500',
                gapLabel: gap > 0 ? `+${gap}` : '✓',
                gapCls: 'text-emerald-400',
              },
              borderline: {
                icon: <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />,
                rowCls: 'border-amber-500/20 bg-amber-500/5',
                nameCls: 'text-slate-200',
                barCls: 'bg-amber-500',
                gapLabel: String(gap),
                gapCls: 'text-amber-400',
              },
              not_accepted: {
                icon: <XCircle className="h-4 w-4 text-rose-400/50 shrink-0" />,
                rowCls: 'border-slate-800/50 bg-transparent',
                nameCls: 'text-slate-500',
                barCls: 'bg-rose-500/30',
                gapLabel: String(gap),
                gapCls: 'text-rose-400/60',
              },
              no_threshold: {
                icon: <GraduationCap className="h-4 w-4 text-purple-400 shrink-0" />,
                rowCls: 'border-purple-500/20 bg-purple-500/5',
                nameCls: 'text-slate-300',
                barCls: 'bg-purple-500/50',
                gapLabel: 'אודישן',
                gapCls: 'text-purple-400',
              },
            }[status];

            return (
              <div
                key={program.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${cfg.rowCls} transition`}
              >
                {cfg.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold truncate ${cfg.nameCls}`}>
                      {program.fieldOfStudy}
                    </span>
                    <span className={`text-xs font-black shrink-0 tabular-nums ${cfg.gapCls}`}>
                      {cfg.gapLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.barCls}`}
                        style={{ width: getBarWidth(threshold) }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {threshold !== null && (
                        <span className="text-[10px] text-slate-600">סף {threshold}</span>
                      )}
                      <span className="text-[10px] text-slate-700 px-1.5 py-0.5 bg-slate-800/50 rounded-full">
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
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950">
          <p className="text-[10px] text-slate-700 text-center">
            הנתונים לצורך הערכה בלבד · יש לבדוק באתר האוניברסיטה
          </p>
        </div>
      </div>
    </>
  );
}
