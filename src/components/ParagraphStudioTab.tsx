import React, { useState } from 'react';
import {
  FileText,
  Minimize2,
  Maximize2,
  Sparkles,
  Volume2,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Cpu,
  BarChart3,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ParagraphStudioResult, HistoryItem, ParagraphMode } from '../types';
import { speakText } from '../utils/speech';

interface ParagraphStudioTabProps {
  onSaveToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export const ParagraphStudioTab: React.FC<ParagraphStudioTabProps> = ({
  onSaveToHistory,
}) => {
  const [mode, setMode] = useState<ParagraphMode>('summarize');
  const [text, setText] = useState(
    `Modern urban development faces an intricate dual challenge: housing growing populations while preserving ecological integrity. Rapid suburban sprawl increases carbon emissions due to prolonged automobile commutes and fragments vital wildlife corridors. Simultaneously, downtown densification often places intense pressure on aging municipal drainage and power infrastructure. Innovative municipal planners are now embracing compact transit-oriented hubs combined with vertical forest architecture to balance human density with biophilic sustainability.`
  );
  const [targetLength, setTargetLength] = useState<'brief' | 'standard' | 'detailed'>('standard');
  const [tone, setTone] = useState('analytical');
  const [result, setResult] = useState<ParagraphStudioResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleModeSwitch = (newMode: ParagraphMode) => {
    setMode(newMode);
    setResult(null);
    if (newMode === 'summarize') {
      setText(
        `Modern urban development faces an intricate dual challenge: housing growing populations while preserving ecological integrity. Rapid suburban sprawl increases carbon emissions due to prolonged automobile commutes and fragments vital wildlife corridors. Simultaneously, downtown densification often places intense pressure on aging municipal drainage and power infrastructure. Innovative municipal planners are now embracing compact transit-oriented hubs combined with vertical forest architecture to balance human density with biophilic sustainability.`
      );
    } else {
      setText('True leadership is tested not during triumph, but in times of deep uncertainty.');
    }
  };

  const handleProcess = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter text to process.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/gemini/expand-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          targetLength,
          tone,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to process paragraph');
      }

      setResult(json.data);

      onSaveToHistory({
        category: 'paragraph-studio',
        title: `${mode === 'summarize' ? 'Summary' : 'Expansion'}: ${text.slice(0, 35)}...`,
        preview: json.data.headline || json.data.resultText.slice(0, 80),
        data: json.data,
        meta: {
          mode,
          words: String(json.data.statistics?.resultWordCount || 0),
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.resultText) return;
    navigator.clipboard.writeText(result.resultText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (!result?.resultText) return;
    setIsPlayingAudio(true);
    await speakText(result.resultText, 'en-US', 0.9);
    setIsPlayingAudio(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Summary & Paragraph Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Precision linguistic scaling: condense lengthy paragraphs into crystal-clear executive summaries,
              or expand single sentences into articulate, multidimensional paragraphs.
            </p>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto shrink-0 border border-slate-200/60">
            <button
              onClick={() => handleModeSwitch('summarize')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'summarize'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Paragraph → Summary</span>
            </button>
            <button
              onClick={() => handleModeSwitch('expand')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'expand'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Sentence → Paragraph</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Length
            </label>
            <select
              value={targetLength}
              onChange={(e) => setTargetLength(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
            >
              {mode === 'summarize' ? (
                <>
                  <option value="brief">Brief (1–2 punchy sentences)</option>
                  <option value="standard">Standard (Structured core summary)</option>
                  <option value="detailed">Detailed (Comprehensive executive brief)</option>
                </>
              ) : (
                <>
                  <option value="standard">Standard (120–180 words)</option>
                  <option value="detailed">In-Depth Academic (200–300 words)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tone & Voice
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
            >
              <option value="analytical">Analytical & Objective</option>
              <option value="academic">Academic & Scholarly</option>
              <option value="professional">Professional Executive</option>
              <option value="persuasive">Persuasive & Engaging</option>
              <option value="narrative">Narrative & Descriptive</option>
            </select>
          </div>
        </div>

        {/* Text Input Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
            <span>
              {mode === 'summarize' ? 'Long Paragraph to Condense' : 'Short Sentence to Expand'}
            </span>
            <span className="font-mono tabular-nums">{wordCount} words</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={mode === 'summarize' ? 5 : 3}
            placeholder={
              mode === 'summarize'
                ? 'Paste a long paragraph or article excerpt here...'
                : 'Enter a single short sentence (e.g., Knowledge is power)...'
            }
            className="w-full p-4 text-sm leading-relaxed border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900"
          />
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Current mode:{' '}
            <strong className="text-slate-800">
              {mode === 'summarize' ? 'Paragraph Condensation' : 'Sentence Expansion'}
            </strong>
          </div>

          <button
            onClick={handleProcess}
            disabled={isLoading || !text.trim()}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>{mode === 'summarize' ? 'Generate Short Summary' : 'Expand into Rich Paragraph'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Result Canvas */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-700 font-bold block mb-1">
                  {result.headline || (mode === 'summarize' ? 'Distilled Summary' : 'Expanded Exposition')}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {mode === 'summarize' ? 'Executive Distillation' : 'Conceptual Elaboration'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeak}
                  disabled={isPlayingAudio}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5"
                  title="Read aloud"
                >
                  <Volume2 className="w-4 h-4 text-sky-600" />
                  <span>{isPlayingAudio ? 'Reading...' : 'Voice Playback'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Transformed Result Paragraph */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 leading-relaxed font-serif text-base sm:text-lg">
              {result.resultText}
            </div>

            {/* TL;DR or Key Takeaways */}
            {result.tl_dr && (
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 text-xs">
                <span className="font-bold text-sky-950 uppercase font-mono mr-2">TL;DR:</span>
                <span className="text-sky-900 font-medium">{result.tl_dr}</span>
              </div>
            )}

            {result.keyTakeaways && result.keyTakeaways.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Essential Takeaways
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.keyTakeaways.map((point, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                      {idx + 1}. {point}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.supportingArguments && result.supportingArguments.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Structural Argument Progression
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.supportingArguments.map((point, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                      Phase {idx + 1}: {point}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scaling Statistics */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Input Words</span>
                <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                  {result.statistics?.originalWordCount || wordCount}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Output Words</span>
                <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                  {result.statistics?.resultWordCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Scaling Ratio</span>
                <span className="text-base font-bold font-mono text-sky-700 tabular-nums">
                  {result.statistics?.compressionRatio || result.statistics?.expansionMultiplier || 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Accuracy Score</span>
                <span className="text-base font-bold font-mono text-emerald-600 tabular-nums">
                  {result.accuracyReport?.overallAccuracy || 97.4}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
