import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ContentTransformTab } from './components/ContentTransformTab';
import { EnglishConverterTab } from './components/EnglishConverterTab';
import { WordExplorerTab } from './components/WordExplorerTab';
import { ParagraphStudioTab } from './components/ParagraphStudioTab';
import { HistoryTab } from './components/HistoryTab';
import { TabType, UserProfile, HistoryItem } from './types';
import { Sparkles, Shield, Cpu, BookOpen, Layers } from 'lucide-react';

import defaultUserAvatar from './assets/images/avatar_smartspeak_user_1792208196135.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('transform');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [samples, setSamples] = useState<any>(null);

  // User State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('smartspeak_user');
      if (saved) return JSON.parse(saved);
      // Pre-seed with user's verified profile for seamless immediate access
      return {
        id: 'usr_init_1',
        name: 'Prathamesh Phutane',
        emailOrPhone: 'phutaneprathamesh314@gmail.com',
        avatarUrl: defaultUserAvatar,
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('smartspeak_history');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'hist_sample_1',
          timestamp: Date.now() - 3600000,
          category: 'transform',
          title: 'Content Transform: Artificial intelligence is rapidly...',
          preview: 'Artificial intelligence is transitioning from rule-based to generative multimodal systems.',
          data: {
            shortNotes: [
              'AI is transitioning from rule-based systems to multimodal generative models.',
              'Global enterprises are embedding intelligent copilots across engineering and legal workflows.',
              'Critical challenges emerge around algorithmic bias, energy consumption, and labor shifts.',
              'Multi-stakeholder collaboration is necessary to govern innovation safely.'
            ],
            hindiTranslation: {
              devanagari: 'कृत्रिम बुद्धिमत्ता तेजी से नियम-आधारित प्रणालियों से जटिल जनरेटिव मॉडल में बदल रही है।',
              romanized: 'Kritrim buddhimatta teji se niyam-aadhrit pranaaliyon se jatil generative model mein badal rahi hai.',
              keyVocabulary: [
                { english: 'Artificial Intelligence', hindi: 'कृत्रिम बुद्धिमत्ता', meaning: 'AI technology' }
              ],
              briefSummaryInHindi: 'एआई का विकास नवाचार और शासन दोनों की मांग करता है।'
            },
            questionAndAnswer: [
              {
                id: 1,
                question: 'What major transition is occurring in artificial intelligence?',
                answer: 'AI is shifting from static, rule-based systems to multimodal generative models operating in real time.',
                type: 'Factual',
                difficulty: 'Easy'
              }
            ],
            presentationSlides: [
              {
                slideNumber: 1,
                title: 'The Generative AI Transition',
                bulletPoints: ['Shift from rule-based to multimodal AI', 'Enterprise adoption accelerating'],
                speakerNotes: 'Introduce the core thesis.',
                visualConcept: 'Neural network diagram'
              }
            ],
            mindMap: {
              id: 'root',
              label: 'Artificial Intelligence Evolution',
              details: 'Multimodal transition and governance',
              children: [
                {
                  id: 'b1',
                  label: 'Enterprise Integration',
                  details: 'Copilots across industries',
                  color: '#0ea5e9',
                  children: [
                    { id: 'sub1', label: 'Engineering Workflows', details: 'Automated pipelines' },
                    { id: 'sub2', label: 'Legal Research', details: 'Document synthesis' }
                  ]
                }
              ]
            },
            accuracyReport: {
              readabilityScore: 94,
              vocabularyDiversity: 88,
              lexicalComplexity: 'Advanced',
              syntacticCoherence: 95,
              precisionRating: 96,
              estimatedReadingTime: '2 min',
              hallucinationRisk: '<0.5%',
              factualIntegrityConfidence: 98.7,
              keyLinguisticInsights: ['Active voice clarity', 'High informational density']
            }
          } as any,
          meta: { wordCount: '112', readability: '94%' },
        },
        {
          id: 'hist_sample_2',
          timestamp: Date.now() - 7200000,
          category: 'converter',
          title: 'Convert: "I handled a big problem..."',
          preview: 'I proactively resolved a mission-critical bottleneck during our lead\'s absence, delivering on deadline.',
          data: {} as any,
          meta: { situation: 'job interview', dialect: 'usa english' },
        },
      ];
    } catch {
      return [];
    }
  });

  // Persist user and history
  useEffect(() => {
    if (user) {
      localStorage.setItem('smartspeak_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartspeak_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('smartspeak_history', JSON.stringify(history));
  }, [history]);

  // Load sample content from backend on mount
  useEffect(() => {
    fetch('/api/samples')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSamples(data);
      })
      .catch((err) => console.log('Could not load samples', err));
  }, []);

  const handleSaveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
  };

  const handleLoadItem = (item: HistoryItem) => {
    if (item.category === 'chat') {
      setActiveTab('transform');
    } else {
      setActiveTab(item.category);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={() => setUser(null)}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'transform' && (
          <ContentTransformTab
            onSaveToHistory={handleSaveToHistory}
            samples={samples}
          />
        )}

        {activeTab === 'converter' && (
          <EnglishConverterTab
            onSaveToHistory={handleSaveToHistory}
            samples={samples}
          />
        )}

        {activeTab === 'word-explorer' && (
          <WordExplorerTab
            onSaveToHistory={handleSaveToHistory}
            samples={samples}
          />
        )}

        {activeTab === 'paragraph-studio' && (
          <ParagraphStudioTab
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onLoadItem={handleLoadItem}
          />
        )}
      </main>

      {/* Minimalistic Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SmartSpeak</span>
            <span>·</span>
            <span>Multimodal Content Transformation & Linguistic Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Powered by Gemini 3.8 Flash</span>
            <span>·</span>
            <span>All Data Processed Server-Side</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
        defaultEmail="phutaneprathamesh314@gmail.com"
      />
    </div>
  );
}
