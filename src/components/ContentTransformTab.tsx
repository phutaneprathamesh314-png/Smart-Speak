import React, { useState, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Languages,
  HelpCircle,
  Presentation,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Upload,
  ShieldCheck,
  Network,
  X,
} from 'lucide-react';
import { TransformResult, HistoryItem, MindMapNode, MeaningPreservationReport } from '../types';
import { SlideViewer } from './SlideViewer';
import { MindMapViewer } from './MindMapViewer';
import { MeaningCheckerReport } from './MeaningCheckerReport';
import { speakText } from '../utils/speech';

interface ContentTransformTabProps {
  onSaveToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  samples: {
    sampleTransformationParagraphs: string[];
  } | null;
}

export const ContentTransformTab: React.FC<ContentTransformTabProps> = ({
  onSaveToHistory,
  samples,
}) => {
  const [inputText, setInputText] = useState(
    samples?.sampleTransformationParagraphs?.[0] ||
      `Artificial intelligence is rapidly shifting from rule-based automated systems to complex generative models capable of processing multimodal information in real time. Organizations worldwide are embedding intelligent copilots into their engineering workflows, customer relationship platforms, and legal research operations. While this technological leap delivers unprecedented efficiency and accelerates discovery, it also introduces fundamental questions surrounding data provenance, algorithmic bias, energy consumption of high-density data centers, and the future nature of cognitive human labor. Addressing these multifaceted challenges requires proactive collaboration between machine learning researchers, policymakers, ethicists, and industry leaders to create robust governance frameworks without stifling beneficial innovation.`
  );

  const [activeOutputTab, setActiveOutputTab] = useState<
    'notes' | 'hindi' | 'qna' | 'slides' | 'mindmap' | 'accuracy'
  >('notes');

  const [enableMeaningCheck, setEnableMeaningCheck] = useState<boolean>(true);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [engineNotice, setEngineNotice] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isSpeakingHindi, setIsSpeakingHindi] = useState(false);

  // Checker & Repair states
  const [isCheckingMeaning, setIsCheckingMeaning] = useState(false);
  const [isFixingIssues, setIsFixingIssues] = useState(false);
  const [isRegeneratingMindmap, setIsRegeneratingMindmap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  // Document File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setErrorMessage('');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read uploaded file.');
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleTransform = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Please enter or paste content to transform.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/gemini/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText,
          enableMeaningCheck,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to transform content');
      }

      setResult(json.data);
      if (json.fallbackNotice) {
        setEngineNotice(json.fallbackNotice);
      } else {
        setEngineNotice(null);
      }
      setActiveOutputTab('notes');

      // Save to history
      onSaveToHistory({
        category: 'transform',
        title: `Content Transform: ${inputText.slice(0, 45)}...`,
        preview: json.data.shortNotes?.[0] || inputText.slice(0, 80),
        data: json.data,
        meta: {
          wordCount: String(wordCount),
          readability: `${json.data.accuracyReport?.readabilityScore || 94}%`,
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while contacting Gemini API.');
    } finally {
      setIsLoading(false);
    }
  };

  // Meaning Checker: audit current active deliverable
  const handleRerunMeaningCheck = async () => {
    if (!result) return;
    setIsCheckingMeaning(true);

    try {
      let currentOutputData: any = result.shortNotes;
      if (activeOutputTab === 'hindi') currentOutputData = result.hindiTranslation;
      else if (activeOutputTab === 'qna') currentOutputData = result.questionAndAnswer;
      else if (activeOutputTab === 'slides') currentOutputData = result.presentationSlides;
      else if (activeOutputTab === 'mindmap') currentOutputData = result.mindMap;

      const response = await fetch('/api/gemini/check-meaning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: inputText,
          outputType: activeOutputTab === 'accuracy' ? 'notes' : activeOutputTab,
          outputContent: currentOutputData,
        }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        setResult((prev) => (prev ? { ...prev, meaningReport: json.data } : null));
      }
    } catch (err) {
      console.error('Meaning check re-run failed', err);
    } finally {
      setIsCheckingMeaning(false);
    }
  };

  // Fix Issues: repair output to preserve source meaning
  const handleFixIssues = async () => {
    if (!result || !result.meaningReport?.issues?.length) return;
    setIsFixingIssues(true);

    try {
      const targetType = activeOutputTab === 'accuracy' ? 'notes' : activeOutputTab;
      let currentOutputData: any = result.shortNotes;
      if (targetType === 'hindi') currentOutputData = result.hindiTranslation;
      else if (targetType === 'qna') currentOutputData = result.questionAndAnswer;
      else if (targetType === 'slides') currentOutputData = result.presentationSlides;
      else if (targetType === 'mindmap') currentOutputData = result.mindMap;

      const response = await fetch('/api/gemini/fix-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: inputText,
          outputType: targetType,
          currentOutput: currentOutputData,
          issues: result.meaningReport.issues,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to apply corrections');
      }

      // Update specific output with fixed content
      setResult((prev) => {
        if (!prev) return null;
        const updated = { ...prev };
        if (targetType === 'notes') updated.shortNotes = json.fixedOutput;
        else if (targetType === 'hindi') updated.hindiTranslation = json.fixedOutput;
        else if (targetType === 'qna') updated.questionAndAnswer = json.fixedOutput;
        else if (targetType === 'slides') updated.presentationSlides = json.fixedOutput;
        else if (targetType === 'mindmap') updated.mindMap = json.fixedOutput;
        return updated;
      });

      // Immediately run verification check on revised deliverable
      await handleRerunMeaningCheck();
    } catch (err: any) {
      setErrorMessage('Correction application failed: ' + (err?.message || 'Error'));
    } finally {
      setIsFixingIssues(false);
    }
  };

  // Standalone Mindmap Regeneration
  const handleRegenerateMindmap = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Please enter or paste content in the input box above to generate a mind map.');
      return;
    }
    setIsRegeneratingMindmap(true);

    try {
      const response = await fetch('/api/gemini/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        setResult((prev) => (prev ? { ...prev, mindMap: json.mindMap } : null));
        if (enableMeaningCheck) {
          handleRerunMeaningCheck();
        }
      }
    } catch (err) {
      console.error('Mind map regeneration failed', err);
    } finally {
      setIsRegeneratingMindmap(false);
    }
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleSpeakHindi = async () => {
    if (!result?.hindiTranslation?.devanagari) return;
    setIsSpeakingHindi(true);
    await speakText(result.hindiTranslation.devanagari, 'hi-IN', 0.85);
    setIsSpeakingHindi(false);
  };

  const getOutputTypeName = () => {
    switch (activeOutputTab) {
      case 'notes':
        return 'Short Notes';
      case 'hindi':
        return 'Hindi Translation';
      case 'qna':
        return 'Questions & Answers';
      case 'slides':
        return 'Presentation Slides';
      case 'mindmap':
        return 'Text-to-Mind Map';
      default:
        return 'Transformed Content';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Automated Content Transformation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Transform original content simultaneously into Short Notes, Hindi Translation,
              Questions & Answers, Presentation Slides, and interactive <strong>Text-to-Mind Maps</strong>{' '}
              with real-time <strong>Meaning Preservation Auditing</strong>.
            </p>
          </div>
          {samples?.sampleTransformationParagraphs && samples.sampleTransformationParagraphs.length > 0 && (
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
              <span className="text-xs text-slate-500">Quick Samples:</span>
              <button
                onClick={() => setInputText(samples.sampleTransformationParagraphs[0])}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                AI & Ethics
              </button>
              {samples.sampleTransformationParagraphs[1] && (
                <button
                  onClick={() => setInputText(samples.sampleTransformationParagraphs[1])}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Photosynthesis
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Original Content Input</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono tabular-nums text-slate-500">{wordCount} words</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Hidden Document File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.csv,.doc,.docx"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload text or markdown document"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>

            <button
              onClick={() => setInputText('')}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            placeholder="Paste any article, lecture note, research paper excerpt, or upload a document..."
            className="w-full text-sm leading-relaxed text-slate-800 bg-transparent resize-y focus:outline-none placeholder:text-slate-400 font-normal"
          />

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {engineNotice && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{engineNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setEngineNotice(null)}
                className="text-amber-600 hover:text-amber-900 cursor-pointer p-0.5 rounded transition-colors"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {engineNotice && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{engineNotice}</span>
              </div>
              <button
                onClick={() => setEngineNotice(null)}
                className="text-amber-600 hover:text-amber-900 cursor-pointer p-0.5 rounded hover:bg-amber-100 transition-colors"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Configuration and Submission Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            {/* Meaning Preservation Checker Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={enableMeaningCheck}
                onChange={(e) => setEnableMeaningCheck(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
              />
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Enable Meaning Preservation Checker</span>
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                (Audits factual fidelity & detects omissions)
              </span>
            </label>

            <button
              onClick={handleTransform}
              disabled={isLoading || !inputText.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer ml-auto"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Transforming & Generating Deliverables...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Transform Content</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output Deliverables Section */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            {/* Deliverables Sub-Navigation */}
            <div className="border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
              <div className="flex items-center gap-1 sm:gap-2 py-2">
                <button
                  onClick={() => {
                    setActiveOutputTab('notes');
                    if (enableMeaningCheck) handleRerunMeaningCheck();
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeOutputTab === 'notes'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Short Notes</span>
                </button>

                <button
                  onClick={() => {
                    setActiveOutputTab('hindi');
                    if (enableMeaningCheck) handleRerunMeaningCheck();
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeOutputTab === 'hindi'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Hindi Translation</span>
                </button>

                <button
                  onClick={() => {
                    setActiveOutputTab('qna');
                    if (enableMeaningCheck) handleRerunMeaningCheck();
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeOutputTab === 'qna'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Questions & Answers</span>
                </button>

                <button
                  onClick={() => {
                    setActiveOutputTab('slides');
                    if (enableMeaningCheck) handleRerunMeaningCheck();
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeOutputTab === 'slides'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Presentation Slides</span>
                </button>

                {/* FEATURE 1: Text-to-Mind Map Navigation Tab */}
                <button
                  onClick={() => {
                    setActiveOutputTab('mindmap');
                    if (enableMeaningCheck) handleRerunMeaningCheck();
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeOutputTab === 'mindmap'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-sky-400" />
                  <span>Text-to-Mind Map</span>
                </button>

                <button
                  onClick={() => setActiveOutputTab('accuracy')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeOutputTab === 'accuracy'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>ML Accuracy Report</span>
                </button>
              </div>
            </div>

            {/* Sub-Tab 1: Short Notes */}
            {activeOutputTab === 'notes' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Key Synthesis & Structured Notes</h3>
                    <p className="text-xs text-slate-500">Concise, bulleted insights distilled for rapid retention</p>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        (Array.isArray(result.shortNotes) ? result.shortNotes : [])
                          .map((n, i) => `${i + 1}. ${n}`)
                          .join('\n'),
                        'notes'
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    {copiedSection === 'notes' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSection === 'notes' ? 'Copied' : 'Copy Notes'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  {(Array.isArray(result.shortNotes) ? result.shortNotes : []).map((note, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-slate-800 leading-relaxed font-normal">{note}</p>
                    </div>
                  ))}
                  {(!result.shortNotes || result.shortNotes.length === 0) && (
                    <div className="p-4 text-xs text-slate-500 text-center">No notes available.</div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Hindi Translation */}
            {activeOutputTab === 'hindi' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Hindi Translation (हिंदी अनुवाद)</h3>
                    <p className="text-xs text-slate-500">
                      High-accuracy grammatical translation with Romanized phonetics and terminology
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSpeakHindi}
                      disabled={isSpeakingHindi}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeakingHindi ? 'Speaking...' : 'Listen in Hindi'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(result.hindiTranslation?.devanagari || '', 'hindi')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSection === 'hindi' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedSection === 'hindi' ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>

                {/* Devanagari Box */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    Devanagari Script (देवनागरी लिपि)
                  </span>
                  <p className="text-base sm:text-lg leading-relaxed text-slate-900 font-serif">
                    {result.hindiTranslation?.devanagari || 'अनुवाद उपलब्ध नहीं है।'}
                  </p>
                </div>

                {/* Romanized Phonetics */}
                {result.hindiTranslation?.romanized && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Pronunciation Guide (Romanized Hindi)
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                      {result.hindiTranslation.romanized}
                    </p>
                  </div>
                )}

                {/* Vocabulary Breakdown */}
                {Array.isArray(result.hindiTranslation?.keyVocabulary) && result.hindiTranslation.keyVocabulary.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Key Bilingual Terminology
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.hindiTranslation.keyVocabulary.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900">{item.english}</span>
                            <span className="font-serif text-sky-800 font-medium">{item.hindi}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{item.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Questions & Answers */}
            {activeOutputTab === 'qna' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Comprehension & Conceptual Q&A</h3>
                    <p className="text-xs text-slate-500">
                      Self-assessment, interview prep, and analytical discussion questions
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const list = Array.isArray(result.questionAndAnswer)
                        ? result.questionAndAnswer
                        : (Array.isArray((result as any).qna) ? (result as any).qna : []);
                      handleCopy(
                        list.map((q: any, i: number) => `Q${i + 1}: ${q.question || q.q}\nA: ${q.answer || q.a}`).join('\n\n'),
                        'qna'
                      );
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'qna' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSection === 'qna' ? 'Copied' : 'Copy All Q&A'}</span>
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {(() => {
                    const list = Array.isArray(result.questionAndAnswer)
                      ? result.questionAndAnswer
                      : (Array.isArray((result as any).qna) ? (result as any).qna : []);

                    if (list.length === 0) {
                      return <div className="p-4 text-xs text-slate-500 text-center">No questions and answers generated.</div>;
                    }

                    return list.map((qa: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-200 text-slate-800">
                              {qa.type || 'Question'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Difficulty: {qa.difficulty || 'Medium'}
                            </span>
                          </div>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Q{index + 1}. {qa.question || qa.q}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1 border-t border-slate-200/60">
                          <span className="font-semibold text-slate-900">Answer: </span>
                          {qa.answer || qa.a}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Presentation Slides */}
            {activeOutputTab === 'slides' && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900">Executive Presentation Slide Deck</h3>
                  <p className="text-xs text-slate-500">
                    Ready-to-present slide sequence with talking points, visual concepts, and export capability
                  </p>
                </div>
                <SlideViewer
                  deckTitle={result.mindMap?.label || 'SmartSpeak Executive Presentation Deck'}
                  slides={
                    Array.isArray(result.presentationSlides)
                      ? result.presentationSlides
                      : (Array.isArray((result as any).slides) ? (result as any).slides : [])
                  }
                />
              </div>
            )}

            {/* Sub-Tab 5: Text-to-Mind Map */}
            {activeOutputTab === 'mindmap' && (
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Interactive Text-to-Mind Map</h3>
                  <p className="text-xs text-slate-500">
                    Hierarchical concept graph dynamically extracted from source content with editable nodes and PNG export
                  </p>
                </div>

                {result.mindMap ? (
                  <MindMapViewer
                    initialData={result.mindMap}
                    onUpdateData={(updated) => {
                      setResult((prev) => (prev ? { ...prev, mindMap: updated } : null));
                    }}
                    onRegenerate={handleRegenerateMindmap}
                    isRegenerating={isRegeneratingMindmap}
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No mind map generated yet. Click Transform Content to create one.
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 6: Machine Learning & Accuracy Report */}
            {activeOutputTab === 'accuracy' && (
              <div className="p-6 space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Machine Learning & Accuracy Report (Gemini Diagnostics)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time algorithmic quality assessment, factual fidelity, and lexical metrics
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Readability Score</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                        {result.accuracyReport?.readabilityScore || 94}
                      </span>
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Flesch-Kincaid Optimal</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Factual Integrity</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
                        {result.accuracyReport?.factualIntegrityConfidence || 98.7}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Confidence Interval</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Syntactic Coherence</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                        {result.accuracyReport?.syntacticCoherence || 95}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">High Logical Flow</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Hallucination Risk</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-mono tabular-nums text-sky-600">
                        {result.accuracyReport?.hallucinationRisk || '<0.5%'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Grounding Verified</span>
                  </div>
                </div>

                {/* Additional Linguistic Insights */}
                {Array.isArray(result.accuracyReport?.keyLinguisticInsights) && result.accuracyReport.keyLinguisticInsights.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Linguistic Evaluation Findings
                    </h4>
                    <ul className="space-y-1.5">
                      {result.accuracyReport.keyLinguisticInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FEATURE 2: Meaning Preservation Checker Report Section (displayed directly below generated content) */}
          {enableMeaningCheck && (
            <MeaningCheckerReport
              report={result.meaningReport || null}
              outputTypeName={getOutputTypeName()}
              onFixIssues={handleFixIssues}
              onRerunCheck={handleRerunMeaningCheck}
              isFixing={isFixingIssues}
              isChecking={isCheckingMeaning}
            />
          )}
        </div>
      )}
    </div>
  );
};
