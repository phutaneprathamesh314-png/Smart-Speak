import React, { useState } from 'react';
import { Sparkles, User, LogOut, ChevronDown, CheckCircle2, History } from 'lucide-react';
import { TabType, UserProfile } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onSignOut,
  historyCount,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('transform')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
                SmartSpeak
              </span>
            </button>
          </div>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => setActiveTab('transform')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'transform'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transform
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'converter'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Advanced English
            </button>
            <button
              onClick={() => setActiveTab('word-explorer')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'word-explorer'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Word Explorer
            </button>
            <button
              onClick={() => setActiveTab('paragraph-studio')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'paragraph-studio'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paragraph Studio
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>History</span>
              {historyCount > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-slate-500 font-normal">
                  ({historyCount})
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium transition-colors"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                  ) : null}
                  {!user.avatarUrl && (
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.emailOrPhone}</p>
                      <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Real-time Gemini Sync Active
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveTab('history');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      View Transformation History
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center overflow-x-auto py-2.5 border-t border-slate-100 gap-4 text-xs font-medium scrollbar-none">
          <button
            onClick={() => setActiveTab('transform')}
            className={`whitespace-nowrap px-1 py-0.5 ${
              activeTab === 'transform' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-600'
            }`}
          >
            Transform
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`whitespace-nowrap px-1 py-0.5 ${
              activeTab === 'converter' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-600'
            }`}
          >
            Advanced English
          </button>
          <button
            onClick={() => setActiveTab('word-explorer')}
            className={`whitespace-nowrap px-1 py-0.5 ${
              activeTab === 'word-explorer' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-600'
            }`}
          >
            Word Explorer
          </button>
          <button
            onClick={() => setActiveTab('paragraph-studio')}
            className={`whitespace-nowrap px-1 py-0.5 ${
              activeTab === 'paragraph-studio' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-600'
            }`}
          >
            Paragraph Studio
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap px-1 py-0.5 ${
              activeTab === 'history' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-600'
            }`}
          >
            History ({historyCount})
          </button>
        </div>
      </div>
    </header>
  );
};
