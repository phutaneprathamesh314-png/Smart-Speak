export type TabType = 'transform' | 'converter' | 'word-explorer' | 'paragraph-studio' | 'history';

export interface UserProfile {
  id: string;
  name: string;
  emailOrPhone: string;
  avatarUrl?: string;
  provider: 'local' | 'google';
  createdAt: string;
}

// 1. Content Transform Types
export interface SlideDiagramStep {
  step: string;
  title: string;
  desc?: string;
}

export interface SlideComparisonRow {
  aspect: string;
  left: string;
  right: string;
}

export interface SlideItem {
  slideNumber: number;
  slideType?: 'title' | 'content-with-image' | 'process-diagram' | 'comparison' | 'conclusion-summary' | 'infographic';
  title: string;
  subtitle?: string;
  bulletPoints: string[];
  speakerNotes: string;
  visualConcept: string;
  imagePrompt?: string;
  imageUrl?: string;
  imageAlt?: string;
  diagramData?: {
    type?: 'process' | 'comparison' | 'stats' | 'timeline';
    steps?: SlideDiagramStep[];
    comparisonRows?: SlideComparisonRow[];
    stats?: Array<{ label: string; value: string }>;
  };
}

export interface QnAItem {
  id: number;
  question: string;
  answer: string;
  type: string;
  difficulty: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  details?: string;
  color?: string;
  isCollapsed?: boolean;
  children?: MindMapNode[];
}

export type MeaningIssueCategory =
  | 'missing_info'
  | 'contradiction'
  | 'changed_data'
  | 'unsupported_claim'
  | 'needs_review';

export type MeaningIssueSeverity = 'high' | 'medium' | 'low' | 'info';

export interface MeaningIssue {
  id: string;
  category: MeaningIssueCategory;
  severity: MeaningIssueSeverity;
  title: string;
  explanation: string;
  sourceExcerpt?: string;
  generatedExcerpt?: string;
  suggestedCorrection?: string;
}

export interface MeaningPreservationReport {
  status: 'high_fidelity' | 'minor_discrepancies' | 'significant_issues' | 'unverified';
  statusLabel: string;
  summary: string;
  preservedPoints: string[];
  issues: MeaningIssue[];
  totalIssuesCount: number;
  criticalIssuesCount: number;
  evaluatedAt: string;
  disclaimer: string;
}

export interface TransformAccuracyReport {
  readabilityScore: number;
  vocabularyDiversity: number;
  lexicalComplexity: string;
  syntacticCoherence: number;
  precisionRating: number;
  estimatedReadingTime: string;
  hallucinationRisk: string;
  factualIntegrityConfidence: number;
  keyLinguisticInsights: string[];
}

export interface TransformResult {
  shortNotes: string[];
  hindiTranslation: {
    devanagari: string;
    romanized: string;
    keyVocabulary: Array<{ english: string; hindi: string; meaning: string }>;
    briefSummaryInHindi?: string;
  };
  questionAndAnswer: QnAItem[];
  presentationSlides: SlideItem[];
  mindMap: MindMapNode;
  accuracyReport: TransformAccuracyReport;
  meaningReport?: MeaningPreservationReport;
}

// 2. English Converter Types
export type SituationType =
  | 'casual'
  | 'ielts speaking'
  | 'professional'
  | 'college'
  | 'job interview'
  | 'movie style'
  | 'none';

export type ExplanationLanguageType = 'english' | 'hindi' | 'marathi' | 'gujarati' | 'tamil';

export type DialectType = 'uk english' | 'usa english' | 'none';

export type PhraseModeType = 'idioms' | 'phrases' | 'proverbs' | 'none';

export interface ConvertAccuracyReport {
  vocabularyUpgradeScore: number;
  contextualAppropriateness: number;
  fluencyRating: number;
  cefrBand: string;
  ieltsEquivalent: string;
  toneAnalysis: string;
}

export interface ConvertResult {
  advancedSentence: string;
  alternativeOptions: Array<{
    sentence: string;
    style: string;
    context: string;
  }>;
  explanationInSelectedLanguage: string;
  explanationLanguage: string;
  appliedPhrases: Array<{
    phrase: string;
    type: string;
    meaning: string;
    originOrUsage: string;
  }>;
  vocabularyUpgrades: Array<{
    originalWord: string;
    advancedAlternative: string;
    cefrLevel: string;
    nuance: string;
  }>;
  accuracyReport: ConvertAccuracyReport;
}

// 3. Word Explorer Types
export interface WordExplorerResult {
  word: string;
  phoneticIpa: string;
  phoneticGuide: string;
  partOfSpeech: string;
  cefrLevel: string;
  primaryDefinition: string;
  definitions: Array<{ meaning: string; domain: string }>;
  examples: Array<{ category: string; sentence: string }>;
  synonyms: string[];
  antonyms: string[];
  etymology: string;
  collocations: string[];
  commonMistakesOrTips: string;
  accuracyMetrics: {
    frequencyScore: string;
    utilityScore: number;
    confidenceRating: number;
  };
}

// 4. Paragraph Studio Types
export type ParagraphMode = 'summarize' | 'expand' | 'chat';

export interface ParagraphStudioResult {
  mode: ParagraphMode;
  resultText: string;
  headline: string;
  keyTakeaways?: string[];
  tl_dr?: string;
  supportingArguments?: string[];
  statistics: {
    originalWordCount: number;
    resultWordCount: number;
    compressionRatio?: string;
    expansionMultiplier?: string;
    readingTimeSaved?: string;
    estimatedReadingTime?: string;
  };
  accuracyReport: {
    informationRetentionScore?: number;
    coherenceRating?: number;
    concisenessScore?: number;
    semanticFidelityScore?: number;
    rhetoricalCoherence?: number;
    lexicalRichness?: number;
    overallAccuracy: number;
    qualityInsights: string[];
  };
}

// 5. Chat with Text or PDF Types
export interface PdfPageContent {
  pageNumber: number;
  text: string;
}

export interface DocumentInfo {
  type: 'pdf' | 'text';
  name: string;
  size?: number;
  totalPages?: number;
  pages?: PdfPageContent[];
  fullText: string;
  wordCount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  citedPages?: number[];
  language?: string;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  docTitle: string;
  docType: 'pdf' | 'text';
  totalPages?: number;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// History Item
export interface HistoryItem {
  id: string;
  timestamp: number;
  category: 'transform' | 'converter' | 'word-explorer' | 'paragraph-studio' | 'chat';
  title: string;
  preview: string;
  data: TransformResult | ConvertResult | WordExplorerResult | ParagraphStudioResult | ChatSession;
  meta?: Record<string, string>;
}
