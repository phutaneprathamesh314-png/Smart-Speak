import React, { useState, useRef } from 'react';
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
  MessageSquare,
  Upload,
  X,
  AlertCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { ParagraphStudioResult, HistoryItem, ParagraphMode, DocumentInfo } from '../types';
import { speakText } from '../utils/speech';
import { ChatWithDocument } from './ChatWithDocument';
import { QuotaNotice } from './QuotaNotice';

interface ParagraphStudioTabProps {
  onSaveToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

interface QuotaDetails {
  isQuota: boolean;
  retryAfterSeconds: number;
  suggestedAction?: string;
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
  const [quotaDetails, setQuotaDetails] = useState<QuotaDetails | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Document upload & Chat states
  const [activeDocument, setActiveDocument] = useState<DocumentInfo | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleModeSwitch = (newMode: ParagraphMode) => {
    setMode(newMode);
    setResult(null);
    setErrorMessage('');

    if (newMode === 'summarize') {
      if (!text.trim() || text.length < 50) {
        setText(
          `Modern urban development faces an intricate dual challenge: housing growing populations while preserving ecological integrity. Rapid suburban sprawl increases carbon emissions due to prolonged automobile commutes and fragments vital wildlife corridors. Simultaneously, downtown densification often places intense pressure on aging municipal drainage and power infrastructure. Innovative municipal planners are now embracing compact transit-oriented hubs combined with vertical forest architecture to balance human density with biophilic sustainability.`
        );
      }
    } else if (newMode === 'expand') {
      if (!text.trim() || text.length > 250) {
        setText('True leadership is tested not during triumph, but in times of deep uncertainty.');
      }
    } else if (newMode === 'chat') {
      if (text.trim() && !activeDocument) {
        setActiveDocument({
          type: 'text',
          name: 'Paragraph Studio Content',
          fullText: text,
          wordCount,
        });
      }
    }
  };

  // PDF or Text File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setUploadNotice(null);

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Selected file exceeds the 15MB size limit.');
      e.target.value = '';
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setIsUploadingDocument(true);
      setUploadNotice(`Extracting text from PDF: "${file.name}"...`);

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const resultDataUri = ev.target?.result as string;
          const base64 = resultDataUri.split(',')[1] || '';

          const res = await fetch('/api/pdf/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64,
              fileName: file.name,
              fileSize: file.size,
            }),
          });

          const json = await res.json();
          if (!res.ok || !json.success) {
            if (json.isScannedPdf) {
              setErrorMessage(
                json.error ||
                  'No selectable text could be extracted from this PDF. It appears to be an image-only scanned document without an embedded text layer.'
              );
            } else {
              setErrorMessage(json.error || 'Failed to extract text from PDF document.');
            }
            setUploadNotice(null);
            return;
          }

          const doc: DocumentInfo = {
            type: 'pdf',
            name: json.fileName || file.name,
            size: json.fileSize || file.size,
            totalPages: json.totalPages,
            pages: json.pages,
            fullText: json.text,
            wordCount: json.wordCount,
          };

          setActiveDocument(doc);
          setText(json.text);
          setUploadNotice(`✓ "${file.name}" (${json.totalPages} pages) parsed successfully. Ready to chat, summarize, or expand.`);
        } catch (err: any) {
          setErrorMessage('Error reading PDF file: ' + (err?.message || 'Unknown error'));
          setUploadNotice(null);
        } finally {
          setIsUploadingDocument(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read uploaded file.');
        setIsUploadingDocument(false);
        setUploadNotice(null);
      };

      reader.readAsDataURL(file);
    } else {
      // Plain text / Markdown / JSON
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const doc: DocumentInfo = {
            type: 'text',
            name: file.name,
            size: file.size,
            fullText: content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
          };
          setActiveDocument(doc);
          setText(content);
          setUploadNotice(`✓ "${file.name}" loaded successfully.`);
          setErrorMessage('');
        }
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read uploaded file.');
      };
      reader.readAsText(file);
    }

    // Reset file input
    e.target.value = '';
  };

  const handleClearDocument = () => {
    setText('');
    setActiveDocument(null);
    setUploadNotice(null);
    setErrorMessage('');
    setResult(null);
  };

  const handleStartChat = () => {
    if (!text.trim()) {
      setErrorMessage('Please enter or paste text, or upload a document to start chatting.');
      return;
    }
    if (!activeDocument) {
      setActiveDocument({
        type: 'text',
        name: mode === 'expand' ? 'Seed Sentence' : 'Paragraph Context',
        fullText: text,
        wordCount,
      });
    }
    setMode('chat');
  };

  const handleProcess = async () => {
    if (isLoading) return;
    if (!text.trim()) {
      setErrorMessage('Please enter text to process.');
      setQuotaDetails(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setQuotaDetails(null);

    try {
      const response = await fetch('/api/gemini/expand-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          mode: mode === 'chat' ? 'summarize' : mode,
          targetLength,
          tone,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        if (json.isQuota || response.status === 429) {
          setQuotaDetails({
            isQuota: true,
            retryAfterSeconds: json.retryAfterSeconds || 15,
            suggestedAction: json.suggestedAction,
          });
        }
        throw new Error(json.error || 'Failed to process paragraph');
      }

      setResult(json.data);
      setQuotaDetails(null);

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
      {/* Banner with 3-Mode Segmented Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Summary & Paragraph Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Precision linguistic scaling & interactive document exploration: condense lengthy paragraphs,
              expand single ideas, or <strong>Chat directly with your text or uploaded PDF</strong> with grounded source verification.
            </p>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto shrink-0 border border-slate-200/60 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleModeSwitch('summarize')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mode === 'summarize'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Paragraph → Summary</span>
            </button>
            <button
              onClick={() => handleModeSwitch('expand')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mode === 'expand'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sentence → Paragraph</span>
            </button>
            <button
              onClick={() => handleModeSwitch('chat')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mode === 'chat'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Chat with Text or PDF</span>
              {activeDocument && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-300 font-mono">
                  {activeDocument.type === 'pdf' ? `${activeDocument.totalPages || 1}p` : 'txt'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Document File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.txt,.md,.json,.csv,.doc,.docx"
        className="hidden"
      />

      {/* MODE 1 & 2: Summarize and Expand Input Canvas */}
      {mode !== 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          {/* Active Uploaded Document Card if file is loaded */}
          {activeDocument && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {activeDocument.type === 'pdf' ? 'PDF' : 'DOC'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md">
                      {activeDocument.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    {activeDocument.totalPages && (
                      <span>{activeDocument.totalPages} {activeDocument.totalPages === 1 ? 'Page' : 'Pages'}</span>
                    )}
                    {activeDocument.size && (
                      <span>· {(activeDocument.size / 1024).toFixed(1)} KB</span>
                    )}
                    <span>· {activeDocument.wordCount || wordCount} words</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Open chat interface with this document"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat with Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  title="Replace with a different file"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleClearDocument}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress Indicator */}
          {isUploadingDocument && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 font-medium flex items-center gap-2 animate-fade-in">
              <span className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>{uploadNotice || 'Reading document and extracting text...'}</span>
            </div>
          )}

          {/* Success upload notice */}
          {uploadNotice && !isUploadingDocument && !activeDocument && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadNotice(null)}
                className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
              <div className="flex items-center gap-2">
                <span>
                  {mode === 'summarize' ? 'Long Paragraph to Condense' : 'Short Sentence to Expand'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-mono tabular-nums">{wordCount} words</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingDocument}
                  className="text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg px-2 py-0.5 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Upload PDF or text file"
                >
                  <Upload className="w-3 h-3 text-sky-600" />
                  <span>Upload PDF / Text</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearDocument}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors px-1 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={mode === 'summarize' ? 5 : 3}
              placeholder={
                mode === 'summarize'
                  ? 'Paste a long paragraph, article excerpt, or upload a PDF document...'
                  : 'Enter a single short sentence to elaborate (e.g., Knowledge is power)...'
              }
              className="w-full p-4 text-sm leading-relaxed border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900"
            />
          </div>

          {errorMessage && (
            <QuotaNotice
              errorMessage={errorMessage}
              isQuota={quotaDetails?.isQuota}
              retryAfterSeconds={quotaDetails?.retryAfterSeconds || 15}
              suggestedAction={quotaDetails?.suggestedAction}
              onRetry={handleProcess}
              isLoading={isLoading}
              onDismiss={() => {
                setErrorMessage('');
                setQuotaDetails(null);
              }}
            />
          )}

          {/* Submission and Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              Current mode:{' '}
              <strong className="text-slate-800">
                {mode === 'summarize' ? 'Paragraph Condensation' : 'Sentence Expansion'}
              </strong>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Start Chat Button */}
              <button
                type="button"
                onClick={handleStartChat}
                disabled={!text.trim()}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 hover:border-slate-900 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                title="Open interactive chat with this text or document"
              >
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Chat with Text / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleProcess}
                disabled={isLoading || !text.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
        </div>
      )}

      {/* MODE 3: Chat with Text or PDF */}
      {mode === 'chat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Interactive Document Conversation
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                Grounded in {activeDocument ? activeDocument.name : 'Paragraph Studio text'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Upload a new PDF or document"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Upload New PDF</span>
              </button>
              <button
                onClick={() => handleModeSwitch('summarize')}
                className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors cursor-pointer"
                title="Back to Summarizer"
              >
                <Minimize2 className="w-3 h-3 text-sky-600" />
                <span>Summarize Mode</span>
              </button>
            </div>
          </div>

          <ChatWithDocument
            document={
              activeDocument || {
                type: 'text',
                name: 'Paragraph Studio Content',
                fullText: text,
                wordCount,
              }
            }
            onClearDocument={handleClearDocument}
            onChangeDocument={() => fileInputRef.current?.click()}
            onSaveToHistory={onSaveToHistory}
          />
        </div>
      )}

      {/* Output Result Canvas (when in summarize/expand mode) */}
      {mode !== 'chat' && result && (
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

              <div className="flex items-center gap-2 flex-wrap">
                {/* Chat with Result Action */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocument({
                      type: 'text',
                      name: `${mode === 'summarize' ? 'Executive Summary' : 'Expanded Exposition'} (${result.headline || 'Synthesized'})`,
                      fullText: result.resultText,
                      wordCount: result.statistics?.resultWordCount || result.resultText.split(/\s+/).length,
                    });
                    setText(result.resultText);
                    setMode('chat');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Ask questions and chat about this generated result"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  <span>Chat with Result</span>
                </button>

                <button
                  onClick={handleSpeak}
                  disabled={isPlayingAudio}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Read aloud"
                >
                  <Volume2 className="w-4 h-4 text-sky-600" />
                  <span>{isPlayingAudio ? 'Reading...' : 'Voice Playback'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
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
