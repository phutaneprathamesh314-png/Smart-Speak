import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  RotateCcw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  AlertCircle,
  Trash2,
  ArrowRight,
  CornerDownLeft,
  Languages,
  RefreshCw,
  Layers,
  FileUp,
  Download,
  Info,
} from 'lucide-react';
import { DocumentInfo, ChatMessage, ChatSession, HistoryItem, UserProfile } from '../types';
import { speakText } from '../utils/speech';
import { QuotaNotice } from './QuotaNotice';

interface ChatWithDocumentProps {
  document: DocumentInfo;
  onClearDocument: () => void;
  onChangeDocument: () => void;
  onSaveToHistory?: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  user?: UserProfile | null;
}

interface QuotaDetails {
  isQuota: boolean;
  retryAfterSeconds: number;
  suggestedAction?: string;
}

const STARTER_PROMPTS = [
  { label: 'Summarize Key Takeaways', prompt: 'Summarize the core takeaways and central arguments of this document in 3 concise bullet points.' },
  { label: 'Explain Step-by-Step', prompt: 'Identify the most complex theoretical or technical concept in this document and explain it step-by-step with an intuitive real-world analogy.' },
  { label: 'Generate Revision Q&A', prompt: 'Generate 5 rigorous revision questions and detailed model answers based on the empirical facts and details in this document.' },
  { label: 'Explain in Simple Hindi', prompt: 'कृपया इस दस्तावेज़ का मुख्य सारांश और प्रमुख अवधारणाएँ सरल हिंदी में समझाइए।' },
  { label: 'Key Definitions & Terms', prompt: 'List and define the primary technical terms, acronyms, or metrics introduced in this document with their exact meanings.' },
  { label: 'Conclusions & Next Steps', prompt: 'What are the main conclusions, risks, recommendations, or forward-looking implications stated in this document?' },
];

export const ChatWithDocument: React.FC<ChatWithDocumentProps> = ({
  document,
  onClearDocument,
  onChangeDocument,
  onSaveToHistory,
  user,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Attempt to restore saved chat for this document from localStorage
    try {
      const savedKey = `smartspeak_chat_${document.name}_${document.fullText.slice(0, 32)}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [inputQuestion, setInputQuestion] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi' | 'marathi' | 'gujarati' | 'tamil'>('english');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaDetails, setQuotaDetails] = useState<QuotaDetails | null>(null);
  const [activePagePreview, setActivePagePreview] = useState<{ pageNumber: number; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Persist messages in localStorage for this document
  useEffect(() => {
    try {
      const savedKey = `smartspeak_chat_${document.name}_${document.fullText.slice(0, 32)}`;
      if (messages.length > 0) {
        localStorage.setItem(savedKey, JSON.stringify(messages));
      } else {
        localStorage.removeItem(savedKey);
      }
    } catch {}
  }, [messages, document]);

  // Handle Send Question
  const handleSendMessage = async (customPrompt?: string) => {
    const questionText = (customPrompt || inputQuestion).trim();
    if (!questionText || isLoading) return;

    setErrorMessage(null);
    setQuotaDetails(null);
    setLastQuestion(questionText);
    setInputQuestion('');

    const userMessage: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: questionText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Prepare compact history (last 8 messages)
      const recentHistory = updatedMessages.slice(-8).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await fetch('/api/gemini/chat-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: document.fullText,
          pages: document.pages || [],
          history: recentHistory,
          question: questionText,
          language: selectedLanguage,
          documentTitle: document.name,
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
        throw new Error(json.error || 'Failed to generate response from Gemini');
      }

      const assistantMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        text: json.answer || 'No response generated.',
        timestamp: Date.now(),
        citedPages: Array.isArray(json.citedPages) ? json.citedPages : [],
        language: json.language || selectedLanguage,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setQuotaDetails(null);

      // Save to SmartSpeak unified history
      if (onSaveToHistory) {
        onSaveToHistory({
          category: 'chat',
          title: `Chat: ${document.name}`,
          preview: `Q: ${questionText.slice(0, 50)}... -> ${assistantMessage.text.slice(0, 80)}...`,
          data: {
            id: 'chat_' + Date.now(),
            docTitle: document.name,
            docType: document.type,
            totalPages: document.totalPages,
            messages: finalMessages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as ChatSession,
          meta: {
            docType: document.type,
            messageCount: String(finalMessages.length),
            language: selectedLanguage,
          },
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err?.message || 'Error communicating with AI service. Please try again.');
      // Add error indicator message
      const errorAssistantMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        text: 'I encountered an issue retrieving the answer from the document due to AI rate limits or connection. Please retry.',
        timestamp: Date.now(),
        isError: true,
      };
      setMessages([...updatedMessages, errorAssistantMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Are you sure you want to clear this conversation history?')) {
      setMessages([]);
      try {
        const savedKey = `smartspeak_chat_${document.name}_${document.fullText.slice(0, 32)}`;
        localStorage.removeItem(savedKey);
      } catch {}
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakText = async (id: string, text: string, lang = 'english') => {
    if (speakingId === id) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis?.cancel();
    setSpeakingId(id);
    try {
      await speakText(text, lang === 'hindi' ? 'hi-IN' : 'en-US', 0.9);
    } finally {
      setSpeakingId(null);
    }
  };

  const handleExportTranscript = () => {
    if (messages.length === 0) return;
    const lines = [
      `# SmartSpeak Document Q&A Transcript`,
      `Document: ${document.name}`,
      `Date: ${new Date().toLocaleString()}`,
      `Total Pages: ${document.totalPages || 'N/A'}`,
      `Word Count: ${document.wordCount || document.fullText.split(/\s+/).length}`,
      `----------------------------------------\n`,
    ];

    messages.forEach((m, idx) => {
      const role = m.sender === 'user' ? 'USER' : 'SMARTSPEAK AI';
      lines.push(`[${role}] (${new Date(m.timestamp).toLocaleTimeString()})`);
      lines.push(m.text);
      if (m.citedPages && m.citedPages.length > 0) {
        lines.push(`Source Pages: ${m.citedPages.join(', ')}`);
      }
      lines.push('\n----------------------------------------\n');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `SmartSpeak_Chat_${document.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to format AI markdown responses cleanly without heavy external parsers
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Heading 3 or 4
          if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
            const headingText = trimmed.replace(/^#{3,4}\s+/, '');
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm sm:text-base pt-2">
                {headingText}
              </h4>
            );
          }

          // Bullet points (* or -)
          if (/^[-*•]\s+/.test(trimmed)) {
            const bulletText = trimmed.replace(/^[-*•]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0 mt-1.5" />
                <div className="flex-1">
                  {renderInlineBold(bulletText)}
                </div>
              </div>
            );
          }

          // Numbered lists (1. or 1))
          if (/^\d+[\.\)]\s+/.test(trimmed)) {
            const match = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
            if (match) {
              return (
                <div key={idx} className="flex items-start gap-2 pl-2">
                  <span className="font-semibold text-slate-900 shrink-0 font-mono text-xs">
                    {match[1]}.
                  </span>
                  <div className="flex-1">
                    {renderInlineBold(match[2])}
                  </div>
                </div>
              );
            }
          }

          // Source citations highlighted
          if (/^Source:\s*Page/i.test(trimmed) || /^Note:\s*/i.test(trimmed)) {
            return (
              <div
                key={idx}
                className="p-2 rounded-lg bg-sky-50/80 border border-sky-100 text-[11px] text-sky-900 font-medium my-1"
              >
                {trimmed}
              </div>
            );
          }

          // Standard paragraph
          return (
            <p key={idx}>
              {renderInlineBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInlineBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[620px]">
      {/* Top Document Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            {document.type === 'pdf' ? (
              <BookOpen className="w-5 h-5 text-sky-400" />
            ) : (
              <FileText className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {document.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-700 uppercase tracking-wider">
                {document.type === 'pdf' ? 'PDF Document' : 'Pasted Text'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              {document.totalPages && (
                <span>{document.totalPages} {document.totalPages === 1 ? 'Page' : 'Pages'}</span>
              )}
              {document.size && (
                <span>{(document.size / 1024).toFixed(1)} KB</span>
              )}
              <span>
                {document.wordCount || document.fullText.split(/\s+/).filter(Boolean).length} words
              </span>
              <span>·</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Grounded In Source
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Target Language Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              title="Select explanation language"
            >
              <option value="english">English (Default)</option>
              <option value="hindi">Hindi (हिंदी)</option>
              <option value="marathi">Marathi (मराठी)</option>
              <option value="gujarati">Gujarati (ગુજરાતી)</option>
              <option value="tamil">Tamil (தமிழ்)</option>
            </select>
          </div>

          {messages.length > 0 && (
            <>
              <button
                onClick={handleExportTranscript}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Export chat transcript as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={handleClearChat}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Clear current conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            </>
          )}

          <button
            onClick={onChangeDocument}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Switch or replace active document"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Change Document</span>
          </button>
        </div>
      </div>

      {/* Main Messages Viewport */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[520px] bg-slate-50/30">
        {messages.length === 0 ? (
          /* Empty State with Helpful College / Research Starters */
          <div className="py-8 px-4 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                Start Chatting with "{document.name}"
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Ask specific questions, request step-by-step explanations, get revision Q&As, or explore complex terms. Every answer is grounded directly in the provided content.
              </p>
            </div>

            {/* Quick Starters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {STARTER_PROMPTS.map((starter, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleSendMessage(starter.prompt)}
                  className="p-3 rounded-xl bg-white border border-slate-200/90 hover:border-slate-900 hover:shadow-sm text-left transition-all duration-150 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                      {starter.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                    {starter.prompt}
                  </p>
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-[11px] text-slate-600">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Strict source attribution enabled: Unverified claims or absent facts will be flagged.</span>
            </div>
          </div>
        ) : (
          /* Chat History Bubbles */
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-xs ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : msg.isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    {/* User Text or Formatted Assistant Answer */}
                    {isUser ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                    ) : (
                      renderFormattedContent(msg.text)
                    )}

                    {/* Verified PDF Page References Badges */}
                    {!isUser && Array.isArray(msg.citedPages) && msg.citedPages.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-sky-600" /> Source Citations:
                        </span>
                        {msg.citedPages.map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => {
                              const found = document.pages?.find((p) => p.pageNumber === pageNum);
                              if (found) {
                                setActivePagePreview(found);
                              }
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Inspect verified excerpt from Page ${pageNum}`}
                          >
                            <span>Page {pageNum}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Footer Controls on AI Bubble */}
                    {!isUser && !msg.isError && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>SmartSpeak Grounded Verification</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSpeakText(msg.id, msg.text, msg.language)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title={speakingId === msg.id ? 'Stop audio' : 'Listen to explanation'}
                          >
                            {speakingId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Loading State */}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 rounded-bl-none shadow-xs flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                  <span>Gemini is reading document context and formulating response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Verified Page Excerpt Modal Preview */}
      {activePagePreview && (
        <div className="p-4 bg-sky-50/90 border-t border-b border-sky-200 text-xs text-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sky-950 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              Verified Excerpt from Page {activePagePreview.pageNumber}
            </span>
            <button
              onClick={() => setActivePagePreview(null)}
              className="text-slate-500 hover:text-slate-900 font-semibold text-xs"
            >
              Close [✕]
            </button>
          </div>
          <div className="max-h-36 overflow-y-auto bg-white p-3 rounded-lg border border-sky-100 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {activePagePreview.text || 'No text extracted on this page.'}
          </div>
        </div>
      )}

      {/* Error / Quota Banner */}
      {errorMessage && (
        <div className="p-3 border-t border-slate-200 bg-white">
          <QuotaNotice
            errorMessage={errorMessage}
            isQuota={quotaDetails?.isQuota}
            retryAfterSeconds={quotaDetails?.retryAfterSeconds || 15}
            suggestedAction={quotaDetails?.suggestedAction}
            onRetry={() => handleSendMessage(lastQuestion)}
            isLoading={isLoading}
            compact={true}
            onDismiss={() => {
              setErrorMessage(null);
              setQuotaDetails(null);
            }}
          />
        </div>
      )}

      {/* Bottom Input Field */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask a question about ${document.name} (e.g. "Summarize section 2", "What is the key takeaway?")...`}
              disabled={isLoading}
              className="w-full p-3 pr-10 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none text-slate-900 bg-white placeholder:text-slate-400 disabled:opacity-50"
            />
            <span className="absolute right-3 bottom-3 text-[10px] text-slate-400 font-mono hidden sm:inline">
              ↵ Enter
            </span>
          </div>

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="h-11 px-4 sm:px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>
            {document.type === 'pdf' ? 'Page-level citation tracking active' : 'Text document context active'}
          </span>
          <span>Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
};
