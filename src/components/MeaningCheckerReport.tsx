import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Wrench,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MeaningPreservationReport, MeaningIssue, MeaningIssueCategory } from '../types';

interface MeaningCheckerReportProps {
  report: MeaningPreservationReport | null;
  outputTypeName: string;
  onFixIssues: () => Promise<void>;
  onRerunCheck: () => Promise<void>;
  isFixing?: boolean;
  isChecking?: boolean;
}

const CATEGORY_LABELS: Record<MeaningIssueCategory, { label: string; color: string }> = {
  missing_info: { label: 'Missing Critical Point', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  changed_data: { label: 'Changed Numbers/Dates/Names', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  contradiction: { label: 'Direct Contradiction', color: 'text-red-800 bg-red-100 border-red-300' },
  unsupported_claim: { label: 'Unsupported Claim', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  needs_review: { label: 'Manual Review Required', color: 'text-sky-700 bg-sky-50 border-sky-200' },
};

const SEVERITY_COLORS = {
  high: 'bg-rose-100 text-rose-800 border-rose-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const MeaningCheckerReport: React.FC<MeaningCheckerReportProps> = ({
  report,
  outputTypeName,
  onFixIssues,
  onRerunCheck,
  isFixing = false,
  isChecking = false,
}) => {
  const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>({});

  if (!report) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-slate-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">Meaning Preservation Checker</h4>
            <p className="text-xs text-slate-500">Run a semantic audit on {outputTypeName} against your original source.</p>
          </div>
        </div>
        <button
          onClick={onRerunCheck}
          disabled={isChecking}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isChecking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>Audit Meaning</span>
        </button>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIssueIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isHighFidelity = report.status === 'high_fidelity' || report.criticalIssuesCount === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">
              Meaning Preservation Report ({outputTypeName})
            </h3>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                isHighFidelity
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {report.statusLabel || (isHighFidelity ? 'High Semantic Fidelity' : 'Discrepancies Detected')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated evaluation checking for omitted key points, altered metrics, inverted claims, or unsupported additions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={onRerunCheck}
            disabled={isChecking || isFixing}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Re-run semantic check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Rerun Checker'}</span>
          </button>

          {report.issues && report.issues.length > 0 && (
            <button
              onClick={onFixIssues}
              disabled={isFixing || isChecking}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              title="Apply AI corrections to resolve flagged meaning discrepancies"
            >
              {isFixing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Fixing Issues...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  <span>Fix Issues</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm text-slate-800 leading-relaxed font-serif">
        {report.summary}
      </div>

      {/* Preserved Points Section */}
      {Array.isArray(report.preservedPoints) && report.preservedPoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preserved Core Information & Concepts</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.preservedPoints.map((point, idx) => (
              <div
                key={`preserved-point-${idx}`}
                className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/80 text-xs text-emerald-950 flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  {typeof point === 'object' && point !== null
                    ? ((point as any).point || (point as any).text || (point as any).description || JSON.stringify(point))
                    : String(point)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Issues List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              Flagged Semantic Nuances & Discrepancies ({Array.isArray(report.issues) ? report.issues.length : 0})
            </span>
          </h4>
          {Array.isArray(report.issues) && report.issues.length > 0 && (
            <span className="text-[11px] text-slate-400">
              Click any item to view comparison excerpts
            </span>
          )}
        </div>

        {(!Array.isArray(report.issues) || report.issues.length === 0) ? (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-emerald-900">Zero Critical Meaning Discrepancies Detected</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              The generated content faithfully captures all essential facts and logic from your original text.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {report.issues.map((issue, idx) => {
              const issueId = (issue && issue.id) ? String(issue.id) : `issue-${idx}`;
              const uniqueKey = `meaning-issue-${issueId}-${idx}`;
              const isExpanded = expandedIssueIds[issueId] ?? true;
              const catConfig = (issue?.category && CATEGORY_LABELS[issue.category]) || {
                label: issue?.category || 'Issue',
                color: 'text-slate-700 bg-slate-50 border-slate-200',
              };
              const sevColor = (issue?.severity && SEVERITY_COLORS[issue.severity]) || SEVERITY_COLORS.medium;

              return (
                <div
                  key={uniqueKey}
                  className="rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all overflow-hidden shadow-xs"
                >
                  {/* Issue Header */}
                  <div
                    onClick={() => toggleExpand(issueId)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border uppercase ${sevColor}`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{issue.title}</span>
                    </div>

                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Issue Body */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 space-y-3 text-xs">
                      <p className="text-slate-700 leading-relaxed">{issue.explanation}</p>

                      {/* Excerpts Comparison Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {issue.sourceExcerpt && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                              Original Source Excerpt
                            </span>
                            <p className="text-slate-800 font-serif leading-relaxed italic">
                              "{issue.sourceExcerpt}"
                            </p>
                          </div>
                        )}

                        {issue.generatedExcerpt && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                              Generated Deliverable Excerpt
                            </span>
                            <p className="text-slate-800 font-serif leading-relaxed italic">
                              "{issue.generatedExcerpt}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Suggested Correction */}
                      {issue.suggestedCorrection && (
                        <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200/80">
                          <span className="text-[10px] font-mono uppercase font-bold text-sky-800 block mb-1">
                            Recommended Correction
                          </span>
                          <p className="text-sky-950 font-medium leading-relaxed">
                            {issue.suggestedCorrection}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Assistance Disclaimer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>{report.disclaimer || 'AI-assisted verification. Always review critical factual changes for high-stakes publications.'}</span>
        </div>
        <span className="font-mono tabular-nums">
          Audited at {new Date(report.evaluatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
