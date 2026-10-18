import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  Lightbulb,
  FileText,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  GitBranch,
  SplitSquareVertical,
  Flag,
} from 'lucide-react';
import { SlideItem } from '../types';
import { exportToPowerPoint } from '../utils/pptxExport';
import { resolveSlideImage } from '../utils/slideImages';

interface SlideViewerProps {
  slides: SlideItem[];
  deckTitle?: string;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  slides,
  deckTitle = 'SmartSpeak Executive Presentation Deck',
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [exportStatusText, setExportStatusText] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<number, boolean>>({});

  // Ensure current index is valid
  useEffect(() => {
    if (currentSlideIndex >= slides.length) {
      setCurrentSlideIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, currentSlideIndex]);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, isFullscreen]);

  if (!slides || slides.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
        No presentation slides generated. Click Transform Content to generate executive slides.
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex] || slides[0];
  const slideNum = currentSlideIndex + 1;
  const slideType = currentSlide.slideType || (currentSlideIndex === 0 ? 'title' : 'content-with-image');

  // Fallback image resolver if imageUrl is not present
  const resolvedImage = currentSlide.imageUrl || resolveSlideImage(currentSlide, currentSlideIndex).url;
  const hasImageError = imageLoadErrors[currentSlideIndex];

  // Real PPTX export with embedded images
  const handleExportPptx = async () => {
    setIsExportingPptx(true);
    setExportError(null);
    setExportStatusText('Preparing presentation package...');

    try {
      await exportToPowerPoint({
        slides,
        deckTitle,
        onProgress: (status) => setExportStatusText(status),
      });
      setExportStatusText('Download ready! Opening PowerPoint file...');
      setTimeout(() => setExportStatusText(null), 3000);
    } catch (err: any) {
      console.error('PPTX Export error:', err);
      setExportError(err?.message || 'Failed to generate PowerPoint file.');
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleCopyMarkdown = () => {
    const markdown = (slides || [])
      .map(
        (s) =>
          `# Slide ${s.slideNumber}: ${s.title}\n${s.subtitle ? `*${s.subtitle}*\n\n` : '\n'}${(Array.isArray(s.bulletPoints) ? s.bulletPoints : [])
            .map((b) => `- ${b}`)
            .join('\n')}\n\n**Visual Concept:** ${s.visualConcept || ''}\n**Topic Image:** ${s.imageUrl || ''}\n\n> Speaker Notes: ${s.speakerNotes || ''}`
      )
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const markdown = (slides || [])
      .map(
        (s) =>
          `# Slide ${s.slideNumber}: ${s.title}\n${s.subtitle ? `*${s.subtitle}*\n\n` : '\n'}${(Array.isArray(s.bulletPoints) ? s.bulletPoints : [])
            .map((b) => `- ${b}`)
            .join('\n')}\n\n**Visual Concept:** ${s.visualConcept || ''}\n**Image Reference:** ${s.imageUrl || ''}\n\n> Speaker Notes: ${s.speakerNotes || ''}`
      )
      .join('\n\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartSpeak_${deckTitle.replace(/\s+/g, '_')}_Outline.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSlideTypeBadge = (type: string) => {
    switch (type) {
      case 'title':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <Sparkles className="w-3 h-3" /> Title & Thesis
          </span>
        );
      case 'process-diagram':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
            <GitBranch className="w-3 h-3" /> Process Architecture
          </span>
        );
      case 'comparison':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-400 border border-violet-400/30">
            <SplitSquareVertical className="w-3 h-3" /> Strategic Comparison
          </span>
        );
      case 'conclusion-summary':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-400/30">
            <Flag className="w-3 h-3" /> Strategic Verdict
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <ImageIcon className="w-3 h-3" /> Topic Visual & Evidence
          </span>
        );
    }
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto flex flex-col justify-between' : ''}`}>
      {/* Slide Navigation & Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-800">
            Slide {slideNum} of {slides.length}
          </span>
          <span className="text-slate-300">·</span>
          {getSlideTypeBadge(slideType)}
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlideIndex
                    ? 'bg-sky-600 w-5'
                    : 'bg-slate-300 hover:bg-slate-400 w-2'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showNotes
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle presenter notes"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Speaker Notes</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            title={isFullscreen ? 'Exit Fullscreen' : 'Present Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Present'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            title="Copy presentation markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            title="Download markdown outline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.md</span>
          </button>

          {/* Primary PPTX Download Button with real embedded images */}
          <button
            onClick={handleExportPptx}
            disabled={isExportingPptx}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Download real PowerPoint (.pptx) with embedded offline images"
          >
            <Download className={`w-3.5 h-3.5 ${isExportingPptx ? 'animate-bounce' : ''}`} />
            <span>{isExportingPptx ? 'Generating PPTX...' : 'Export .pptx'}</span>
          </button>
        </div>
      </div>

      {/* Export notification banner */}
      {exportStatusText && (
        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
            <span>{exportStatusText}</span>
          </div>
          <span className="text-[10px] font-mono text-sky-600">Offline-Ready PPTX</span>
        </div>
      )}

      {exportError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <span>Export failed: {exportError}</span>
        </div>
      )}

      {/* Main Slide Canvas (16:9 Presentation Aspect Ratio) */}
      <div className="relative aspect-[16/9] w-full bg-[#0b1120] text-white rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-10 flex flex-col justify-between border border-slate-800 select-none">
        {/* Subtle grid background and ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-sky-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-10 flex items-start justify-between border-b border-slate-800/80 pb-3">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-wider uppercase text-sky-400 font-bold">
                Slide 0{slideNum}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] font-mono text-slate-400">
                {slideType.toUpperCase().replace('-', ' ')}
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-1 leading-snug">
              {currentSlide.title}
            </h3>
            {currentSlide.subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{currentSlide.subtitle}</p>
            )}
          </div>
          <div className="text-xs font-mono text-slate-500 hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>SmartSpeak AI Deck</span>
          </div>
        </div>

        {/* Slide Body Content: dynamically rendered by slideType */}
        <div className="relative z-10 my-auto py-3">
          {/* Layout A: Title / Hero Slide */}
          {slideType === 'title' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-2">
                  <span className="px-2.5 py-1 rounded-md bg-sky-950/80 border border-sky-400/40 text-sky-300 text-xs font-mono font-semibold tracking-wide uppercase">
                    Strategic Executive Briefing
                  </span>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-1">
                    Automated, high-fidelity linguistic and conceptual transformation synthesized by Google Gemini.
                  </p>
                </div>
                <ul className="space-y-2.5 pt-2">
                  {(Array.isArray(currentSlide?.bulletPoints) ? currentSlide.bulletPoints : []).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-200 text-xs sm:text-sm leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0 shadow-sm shadow-sky-400/50" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Title Hero Image */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-full max-h-56 sm:max-h-64 rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl group">
                  {!hasImageError ? (
                    <img
                      src={resolvedImage}
                      alt={currentSlide.imageAlt || currentSlide.title}
                      onError={() => setImageLoadErrors((prev) => ({ ...prev, [currentSlideIndex]: true }))}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                      <ImageIcon className="w-10 h-10 text-sky-400/50 mb-2" />
                      <span className="text-xs text-slate-400 font-medium">{currentSlide.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-3">
                    <p className="text-[11px] text-slate-300 italic truncate max-w-full">
                      {currentSlide.visualConcept || 'Executive visual representation'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layout B: Process Diagram Slide */}
          {slideType === 'process-diagram' && (
            <div className="space-y-4">
              {/* Process Step Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(currentSlide.diagramData?.steps || [
                  { step: '01', title: 'Input Ingestion', desc: 'Normalized conceptual premise' },
                  { step: '02', title: 'Neural Core', desc: 'Multi-layer transformer structuring' },
                  { step: '03', title: 'Verification', desc: 'Semantic fidelity verification' },
                ]).map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-700/70 relative hover:border-sky-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-sky-400">Phase {st.step}</span>
                      {sIdx < 2 && <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />}
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-white">{st.title}</h5>
                    {st.desc && <p className="text-[11px] text-slate-400 mt-1 leading-normal">{st.desc}</p>}
                  </div>
                ))}
              </div>

              {/* Bottom split: Bullets and Compact Image */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
                <div className="md:col-span-8">
                  <ul className="space-y-2">
                    {(Array.isArray(currentSlide?.bulletPoints) ? currentSlide.bulletPoints : []).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-200 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-4">
                  <div className="h-28 rounded-lg overflow-hidden border border-slate-700/80 shadow-md">
                    <img
                      src={resolvedImage}
                      alt={currentSlide.imageAlt || currentSlide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layout C: Comparison Slide */}
          {slideType === 'comparison' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-8 space-y-3">
                {/* Comparison Mini Table */}
                <div className="rounded-xl overflow-hidden border border-slate-700/80 text-xs">
                  <div className="grid grid-cols-12 bg-slate-800/90 font-semibold p-2 text-slate-300">
                    <div className="col-span-4 text-sky-300">Dimension</div>
                    <div className="col-span-4 text-slate-400">Legacy Approach</div>
                    <div className="col-span-4 text-sky-400 font-bold">SmartSpeak AI</div>
                  </div>
                  {(currentSlide.diagramData?.comparisonRows || [
                    { aspect: 'Throughput', left: 'Manual drafting delay', right: 'Instantaneous synthesis' },
                    { aspect: 'Fidelity', left: 'Unverified drift', right: 'Audited preservation' },
                    { aspect: 'Adaptability', left: 'Single static format', right: '5 dynamic deliverables' },
                  ]).map((row, rIdx) => (
                    <div
                      key={rIdx}
                      className={`grid grid-cols-12 p-2 border-t border-slate-800/80 ${
                        rIdx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-900/30'
                      }`}
                    >
                      <div className="col-span-4 font-semibold text-slate-200">{row.aspect}</div>
                      <div className="col-span-4 text-slate-400">{row.left}</div>
                      <div className="col-span-4 text-sky-300 font-medium">{row.right}</div>
                    </div>
                  ))}
                </div>

                <ul className="space-y-1.5 pt-1">
                  {(Array.isArray(currentSlide?.bulletPoints) ? currentSlide.bulletPoints : []).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comparison Image */}
              <div className="md:col-span-4">
                <div className="rounded-xl overflow-hidden border border-slate-700/80 shadow-lg h-48 sm:h-56">
                  <img
                    src={resolvedImage}
                    alt={currentSlide.imageAlt || currentSlide.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Layout D: Content with Image & Conclusion Summary (Default 2-Column Presentation Layout) */}
          {(slideType === 'content-with-image' || slideType === 'conclusion-summary') && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Bullet Points & Content */}
              <div className="md:col-span-7 space-y-3">
                <ul className="space-y-3 sm:space-y-3.5">
                  {(Array.isArray(currentSlide?.bulletPoints) ? currentSlide.bulletPoints : []).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-200 text-xs sm:text-sm leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0 shadow-sm shadow-sky-400/50" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                  {(!currentSlide?.bulletPoints || currentSlide.bulletPoints.length === 0) && (
                    <li className="text-slate-400 text-xs italic">No bullet points available for this slide.</li>
                  )}
                </ul>

                {slideType === 'conclusion-summary' && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" /> High Semantic Fidelity Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Embedded Topic-Matched Photograph */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-full max-h-56 sm:max-h-64 rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl group">
                  {!hasImageError ? (
                    <img
                      src={resolvedImage}
                      alt={currentSlide.imageAlt || currentSlide.title}
                      onError={() => setImageLoadErrors((prev) => ({ ...prev, [currentSlideIndex]: true }))}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                      <ImageIcon className="w-10 h-10 text-sky-400/50 mb-2" />
                      <span className="text-xs text-slate-400 font-medium">{currentSlide.title}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                    <p className="text-[10px] text-slate-300 italic truncate max-w-full">
                      {currentSlide.visualConcept || 'Topic-matched presentation image'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide Footer */}
        <div className="relative z-10 flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 truncate max-w-lg">
            <span className="font-medium text-slate-300">Visual Layout:</span>
            <span className="truncate italic text-slate-400">{currentSlide.visualConcept}</span>
          </div>
          <div className="font-mono tabular-nums text-slate-400 shrink-0">
            {slideNum} / {slides.length}
          </div>
        </div>

        {/* Left / Right Slide Navigation Overlay Arrows */}
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-slate-700/60 shadow-lg"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlideIndex === slides.length - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-slate-700/60 shadow-lg"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Thumbnail Preview Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
        {slides.map((s, idx) => {
          const thumbImage = s.imageUrl || resolveSlideImage(s, idx).url;
          const isCurrent = idx === currentSlideIndex;
          return (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`shrink-0 w-28 sm:w-36 text-left p-1.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-2 ring-sky-400/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="relative aspect-[16/9] w-full bg-slate-900 rounded-md overflow-hidden mb-1">
                <img src={thumbImage} alt="" className="w-full h-full object-cover opacity-70" />
                <span className="absolute top-1 left-1 px-1 rounded bg-black/60 text-[9px] font-mono text-white">
                  0{idx + 1}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-800 truncate">{s.title}</p>
            </button>
          );
        })}
      </div>

      {/* Speaker Notes Drawer */}
      {showNotes && currentSlide.speakerNotes && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed shadow-xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>Presenter Guidance & Talking Points (Slide {slideNum}):</span>
          </div>
          <p className="text-amber-800/90">{currentSlide.speakerNotes}</p>
        </div>
      )}
    </div>
  );
};
