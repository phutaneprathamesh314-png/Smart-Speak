import React, { useState } from 'react';
import {
  Search,
  Dice5,
  Volume2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  History,
  CheckCircle2,
  Bookmark,
  Share2,
  Check,
  Copy,
} from 'lucide-react';
import { WordExplorerResult, HistoryItem } from '../types';
import { speakText } from '../utils/speech';

interface WordExplorerTabProps {
  onSaveToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  samples: {
    sampleWords: string[];
  } | null;
}

export const WordExplorerTab: React.FC<WordExplorerTabProps> = ({
  onSaveToHistory,
  samples,
}) => {
  const [searchWord, setSearchWord] = useState('Serendipity');
  const [result, setResult] = useState<WordExplorerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  const exploreWord = async (wordToExplore: string) => {
    if (!wordToExplore.trim()) {
      setErrorMessage('Please enter a word to explore.');
      return;
    }

    setSearchWord(wordToExplore.trim());
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/gemini/explore-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordToExplore.trim() }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to explore word');
      }

      setResult(json.data);

      onSaveToHistory({
        category: 'word-explorer',
        title: `Word: ${json.data.word}`,
        preview: json.data.primaryDefinition || json.data.definitions?.[0]?.meaning || '',
        data: json.data,
        meta: {
          phonetic: json.data.phoneticIpa,
          cefr: json.data.cefrLevel,
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomWord = () => {
    const list = samples?.sampleWords || [
      'Serendipity',
      'Ephemeral',
      'Quintessential',
      'Ubiquitous',
      'Perspicacious',
      'Eloquent',
      'Resilience',
      'Paradigm',
      'Cognizant',
      'Magnanimous',
    ];
    const chosen = list[Math.floor(Math.random() * list.length)];
    exploreWord(chosen);
  };

  const handleSpeak = async (word: string) => {
    setIsPlayingAudio(true);
    await speakText(word, 'en-US', 0.85);
    setIsPlayingAudio(false);
  };

  const handleCopyDefinition = () => {
    if (!result) return;
    const text = `${result.word} (${result.phoneticIpa}) - ${result.partOfSpeech}\n${result.primaryDefinition}\n\nExample: ${result.examples?.[0]?.sentence || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Word Explorer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Unlock the deep linguistic anatomy of any English word: definition, IPA pronunciation,
              audio voice playback, real-world examples, interactive synonyms & antonyms, and etymology.
            </p>
          </div>
          <button
            onClick={handleRandomWord}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Dice5 className="w-4 h-4 text-slate-600" />
            <span>Discover Random Word</span>
          </button>
        </div>
      </div>

      {/* Word Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            exploreWord(searchWord);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="Enter any word (e.g., Ephemeral, Perspicacious, Ubiquitous)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchWord.trim()}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing Word...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Explore Word</span>
              </>
            )}
          </button>
        </form>

        {/* Quick word tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">Trending Lexicon:</span>
          {['Quintessential', 'Eloquent', 'Ubiquitous', 'Resilience', 'Perspicacious', 'Alacrity'].map(
            (w) => (
              <button
                key={w}
                type="button"
                onClick={() => exploreWord(w)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {w}
              </button>
            )
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Explorer Results Canvas */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Hero Card for the Word */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 capitalize font-serif">
                    {result.word}
                  </h2>
                  <span className="text-sm font-mono text-slate-500 font-normal">
                    {result.phoneticIpa}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 uppercase">
                    {result.partOfSpeech}
                  </span>
                </div>
                {result.phoneticGuide && (
                  <p className="text-xs text-slate-500 mt-1 italic">
                    Pronunciation guide: <span className="font-medium text-slate-700">{result.phoneticGuide}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => handleSpeak(result.word)}
                  disabled={isPlayingAudio}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Play native audio pronunciation"
                >
                  <Volume2 className="w-4 h-4 text-sky-600" />
                  <span>{isPlayingAudio ? 'Playing...' : 'Voice Pronounce'}</span>
                </button>

                <button
                  onClick={handleCopyDefinition}
                  className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
                  title="Copy definition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Primary Definition */}
            <div className="py-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Primary Definition
              </span>
              <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-serif">
                {result.primaryDefinition}
              </p>
            </div>

            {/* Detailed Definitions by domain */}
            {result.definitions && result.definitions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Contextual Shades of Meaning
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.definitions.map((def, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                        Domain: {def.domain}
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">{def.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Synonyms & Antonyms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Synonyms */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Synonyms (Similar Meaning)</h3>
                <span className="text-[11px] text-slate-400">Click any word to explore</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.synonyms && result.synonyms.length > 0 ? (
                  result.synonyms.map((syn, idx) => (
                    <button
                      key={idx}
                      onClick={() => exploreWord(syn)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition-colors cursor-pointer"
                      title={`Explore synonym: ${syn}`}
                    >
                      {syn}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No direct synonyms available</span>
                )}
              </div>
            </div>

            {/* Antonyms */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Antonyms (Opposite Meaning)</h3>
                <span className="text-[11px] text-slate-400">Click any word to explore</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.antonyms && result.antonyms.length > 0 ? (
                  result.antonyms.map((ant, idx) => (
                    <button
                      key={idx}
                      onClick={() => exploreWord(ant)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60 transition-colors cursor-pointer"
                      title={`Explore antonym: ${ant}`}
                    >
                      {ant}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No direct antonyms recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Contextual Usage Examples */}
          {result.examples && result.examples.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Real-World Contextual Examples</h3>
                <p className="text-xs text-slate-500">
                  Observe how "{result.word}" behaves across various registers and communicative domains
                </p>
              </div>

              <div className="space-y-3">
                {result.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                        {ex.category}
                      </span>
                      <p className="text-sm text-slate-800 font-serif leading-relaxed italic">
                        "{ex.sentence}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleSpeak(ex.sentence)}
                      className="self-start sm:self-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                      title="Listen to example sentence"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etymology & Collocations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Etymology */}
            {result.etymology && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Etymology & Origin Story
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                  {result.etymology}
                </p>
              </div>
            )}

            {/* Collocations */}
            {result.collocations && result.collocations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Natural Collocations (Common Pairings)
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.collocations.map((col, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-700 font-mono"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
