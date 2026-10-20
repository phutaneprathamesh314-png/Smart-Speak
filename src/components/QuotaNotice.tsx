import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RotateCcw, ExternalLink, ShieldAlert, X } from 'lucide-react';

interface QuotaNoticeProps {
  errorMessage: string;
  isQuota?: boolean;
  retryAfterSeconds?: number;
  suggestedAction?: string;
  onRetry: () => void;
  isLoading?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
}

export const QuotaNotice: React.FC<QuotaNoticeProps> = ({
  errorMessage,
  isQuota = false,
  retryAfterSeconds = 15,
  suggestedAction,
  onRetry,
  isLoading = false,
  onDismiss,
  compact = false,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    isQuota ? Math.max(1, retryAfterSeconds) : 0
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isQuota || retryAfterSeconds <= 0) {
      setSecondsRemaining(0);
      return;
    }

    setSecondsRemaining(retryAfterSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isQuota, retryAfterSeconds]);

  if (compact) {
    return (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
        <div className="flex items-center gap-2">
          {isQuota ? (
            <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span className="font-medium">
            {errorMessage}
            {isQuota && secondsRemaining > 0 && (
              <span className="font-mono text-amber-700 ml-1">
                (retry ready in {secondsRemaining}s)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Retrying...' : secondsRemaining > 0 ? `Retry (${secondsRemaining}s)` : 'Retry Now'}</span>
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-amber-700 hover:text-amber-950 rounded cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 sm:p-5 shadow-sm text-slate-800 animate-fade-in space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            {isQuota ? (
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                {isQuota ? 'Gemini AI Quota / Rate Limit Reached' : 'AI Service Notice'}
              </h4>
              {isQuota && secondsRemaining > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  Ready in {secondsRemaining}s
                </span>
              )}
            </div>
            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>
              {isLoading
                ? 'Retrying...'
                : secondsRemaining > 0
                ? `Retry Now (${secondsRemaining}s)`
                : 'Retry Now'}
            </span>
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 text-amber-700 hover:text-amber-950 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Action & Resolution Guide */}
      <div className="pt-2 border-t border-amber-200/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-amber-900/80">
        <p className="italic">
          {suggestedAction || 'Rate limits automatically reset periodically. Your current input text is safely preserved.'}
        </p>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-amber-800 hover:text-amber-950 font-semibold underline text-[11px] self-start sm:self-auto cursor-pointer"
        >
          {showDetails ? 'Hide Quota Details' : 'How Quotas Work'}
        </button>
      </div>

      {showDetails && (
        <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 text-xs text-slate-700 space-y-2 mt-2">
          <p className="font-semibold text-slate-900">Understanding Gemini API Usage Limits:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
            <li>
              <strong>Requests Per Minute (RPM):</strong> Free tier accounts have strict per-minute rate limits that refresh every 60 seconds.
            </li>
            <li>
              <strong>SmartSpeak Resiliency:</strong> Content Transformer automatically activates local semantic retrieval so you never lose work.
            </li>
            <li>
              <strong>Increasing Limits:</strong> To raise request quotas, link a Google Cloud billing account in Google AI Studio (<a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-sky-600 hover:underline inline-flex items-center gap-0.5">ai.google.dev <ExternalLink className="w-2.5 h-2.5" /></a>).
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
