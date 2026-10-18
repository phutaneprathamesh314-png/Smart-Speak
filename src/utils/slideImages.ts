/**
 * Curated high-resolution image directory for SmartSpeak Presentation Slides
 * Verified 100% working, high-aesthetic royalty-free images from Unsplash.
 */

export interface TopicImageCategory {
  category: string;
  keywords: string[];
  images: {
    url: string;
    alt: string;
    caption: string;
  }[];
}

export const SLIDE_IMAGE_CATEGORIES: TopicImageCategory[] = [
  {
    category: 'ai_neural',
    keywords: [
      'ai',
      'artificial intelligence',
      'machine learning',
      'neural',
      'deep learning',
      'model',
      'algorithm',
      'generative',
      'copilot',
      'llm',
      'nlp',
      'bot',
      'gpt',
      'cognitive',
      'agent',
      'automation',
      'intelligence',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        alt: 'Advanced Robotics and Artificial Intelligence Core',
        caption: 'Neural synthesis and generative cognitive architecture',
      },
      {
        url: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80',
        alt: 'Glowing Futuristic Artificial Intelligence Concept',
        caption: 'Deep learning core & transformer embeddings',
      },
      {
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        alt: 'Global Neural Network & Data Matrix',
        caption: 'Multimodal cognitive processing pathways',
      },
    ],
  },
  {
    category: 'data_analytics',
    keywords: [
      'data',
      'analytics',
      'statistics',
      'metric',
      'chart',
      'graph',
      'insights',
      'analysis',
      'quantitative',
      'performance',
      'benchmark',
      'kpi',
      'dashboard',
      'report',
      'evidence',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        alt: 'Data Analytics Dashboard with Multiple Charts',
        caption: 'Quantitative analytics and performance monitoring',
      },
      {
        url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        alt: 'Financial & Growth Analytics Screen',
        caption: 'Trend trajectories and impact benchmarking',
      },
      {
        url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80',
        alt: 'Digital Metrics Visualization Workspace',
        caption: 'Empirical verification and telemetry insight',
      },
    ],
  },
  {
    category: 'strategy_business',
    keywords: [
      'strategy',
      'business',
      'executive',
      'leadership',
      'organization',
      'management',
      'decision',
      'corporate',
      'enterprise',
      'roadmap',
      'vision',
      'stakeholder',
      'team',
      'collaboration',
      'governance',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
        alt: 'Executive Leadership Strategy Session',
        caption: 'Strategic alignment and executive planning',
      },
      {
        url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
        alt: 'Strategic Presentation and Roadmapping',
        caption: 'Collaborative milestones and deployment roadmap',
      },
      {
        url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        alt: 'Modern Tech Team Collaborative Architecture',
        caption: 'Cross-functional consensus and operational governance',
      },
    ],
  },
  {
    category: 'technology_cloud',
    keywords: [
      'technology',
      'cloud',
      'software',
      'platform',
      'infrastructure',
      'server',
      'code',
      'cyber',
      'developer',
      'architecture',
      'hardware',
      'api',
      'devops',
      'network',
      'distributed',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        alt: 'High-Tech Microprocessor and Integrated Circuit',
        caption: 'Next-generation computing hardware architecture',
      },
      {
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        alt: 'Global Connected Cloud Network Matrix',
        caption: 'Distributed cloud infrastructure & planetary scale',
      },
      {
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        alt: 'Digital Code and Data Stream Pipeline',
        caption: 'Algorithmic transformation and compute pipelines',
      },
    ],
  },
  {
    category: 'process_workflow',
    keywords: [
      'process',
      'workflow',
      'pipeline',
      'stages',
      'steps',
      'framework',
      'execution',
      'lifecycle',
      'system',
      'methodology',
      'operations',
      'implementation',
      'cycle',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        alt: 'Systematic Workflow and Operational Process Map',
        caption: 'Structured step-by-step workflow orchestration',
      },
      {
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
        alt: 'Digital Workflow Architecture Workspace',
        caption: 'End-to-end transformation methodology',
      },
      {
        url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        alt: 'Structured Agile Sprint and Execution Stages',
        caption: 'Iterative verification gates and deployment pipeline',
      },
    ],
  },
  {
    category: 'science_medical',
    keywords: [
      'science',
      'medical',
      'healthcare',
      'biology',
      'clinical',
      'laboratory',
      'research',
      'discovery',
      'doctor',
      'patient',
      'health',
      'chemistry',
      'genomics',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
        alt: 'Biomedical Laboratory Research Flasks',
        caption: 'Evidence-based clinical discovery and scientific research',
      },
      {
        url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
        alt: 'Microscopic Biological Structure Exploration',
        caption: 'Precision cellular analysis and scientific exploration',
      },
    ],
  },
  {
    category: 'security_governance',
    keywords: [
      'security',
      'privacy',
      'governance',
      'compliance',
      'risk',
      'audit',
      'protection',
      'policy',
      'safety',
      'ethics',
      'trust',
      'regulation',
      'integrity',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
        alt: 'Digital Security Padlock and Cyber Defense Shield',
        caption: 'Cybersecurity defense, data provenance, and compliance',
      },
      {
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        alt: 'Encrypted Matrix Data Stream',
        caption: 'Zero-trust governance and algorithmic transparency',
      },
    ],
  },
  {
    category: 'finance_economy',
    keywords: [
      'finance',
      'financial',
      'economic',
      'investment',
      'capital',
      'revenue',
      'cost',
      'market',
      'roi',
      'funding',
      'monetary',
      'valuation',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
        alt: 'Financial Growth Chart and Stock Valuation',
        caption: 'Economic ROI and measurable capital valuation',
      },
      {
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
        alt: 'Global Financial Market Dynamics',
        caption: 'Macroeconomic efficiency and market leverage',
      },
    ],
  },
  {
    category: 'education_learning',
    keywords: [
      'education',
      'learning',
      'language',
      'reading',
      'school',
      'knowledge',
      'student',
      'teaching',
      'study',
      'academic',
      'literature',
      'comprehension',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
        alt: 'Library Study and Knowledge Books',
        caption: 'Cognitive literacy and knowledge synthesis',
      },
      {
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        alt: 'Interactive Digital Learning Display',
        caption: 'Adaptive multi-modal pedagogical frameworks',
      },
    ],
  },
  {
    category: 'future_innovation',
    keywords: [
      'future',
      'innovation',
      'vision',
      'transformation',
      'tomorrow',
      'next',
      'breakthrough',
      'disruption',
      'paradigm',
      'frontier',
      'conclusion',
      'next steps',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        alt: 'Architectural Innovation and Strategic Horizon',
        caption: 'Actionable transformation and future horizon',
      },
      {
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        alt: 'Global Visionary Network Horizon',
        caption: 'Strategic imperative and global execution',
      },
    ],
  },
];

/**
 * Intelligently resolves the best matching image for any given slide based on
 * title, bullet points, visual concept, and slide number.
 */
export function resolveSlideImage(
  slide: {
    title?: string;
    bulletPoints?: string[];
    visualConcept?: string;
    imagePrompt?: string;
    imageQuery?: string;
    slideType?: string;
  },
  index: number,
  fallbackTopic = 'technology'
): { url: string; alt: string; caption: string } {
  // Combine all text context
  const fullContext = [
    slide.title || '',
    ...(Array.isArray(slide.bulletPoints) ? slide.bulletPoints : []),
    slide.visualConcept || '',
    slide.imagePrompt || '',
    slide.imageQuery || '',
    slide.slideType || '',
    fallbackTopic,
  ]
    .join(' ')
    .toLowerCase();

  // Score each category
  let bestScore = -1;
  let bestCategory = SLIDE_IMAGE_CATEGORIES[0];

  for (const cat of SLIDE_IMAGE_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = fullContext.match(regex);
      if (matches) {
        score += matches.length * (kw.length > 5 ? 2 : 1);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  // Pick an image from the best category with deterministic offset by slide index
  const images = bestCategory.images;
  const picked = images[index % images.length];

  return {
    url: picked.url,
    alt: slide.title ? `${slide.title} — ${picked.alt}` : picked.alt,
    caption: slide.visualConcept || picked.caption,
  };
}
