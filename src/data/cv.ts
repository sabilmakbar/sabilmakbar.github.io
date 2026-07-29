export const education = [
  {
    title: "Bachelor of Mathematics",
    org: "Bandung Institute of Technology (ITB)",
    year: "2016-2020",
    points: [
      "Focus area in Applied Mathematics (Optimization, PDE, Financial Mathematics)",
      "Core math coursework: Linear Algebra, Real & Complex Analysis, Multivariable Calculus",
      "Intermediate statistics: Probability Theory, Mathematical Statistics",
      "Activities: International Mathematical Modeling Competition (fish population dynamics); Quantitative Finance portfolio-construction challenge",
    ],
  },
];

export const experience = [
  {
    title: "AI Engineer (Research)",
    org: "Stealth AI Startup",
    location: "Kuala Lumpur, Malaysia",
    year: "Jan 2025 - present",
    points: [
      "Fine-tuned cross-domain Speech & Text models with LLM-RAG integration for Voice Assistants, slashing error rates by 50% relative to open-source SOTA in APAC/MENA and achieving parity with GPT-4o & Gemini Pro",
      "Engineered and deployed high-throughput, low-latency audio pipeline modules (Transcription, LID, VAD, Emotion Detection, Audio Spectrogram Transformers), optimizing inference for scalable production Voice Agent frameworks",
      "Overhauled Active Learning pipelines using LLM-assisted auto-labeling and HITL verification, scaling dataset coverage and annotation accuracy by 300%",
      "Built end-to-end data and training automation loops, leveraging DVC and GitHub Actions for event-triggered CI/CD orchestration and rapid, reproducible ML experimentation",
    ],
  },
  {
    title: "Data Scientist",
    org: "Stealth Startup",
    location: "Remote",
    year: "Sep 2024 - Dec 2024",
    points: [
      "Detected and tackled fraudulent activities, mitigating 25% of complaints and averting ~30% of monthly losses",
      "Reviewed fraud networks from past cases using Graph DS and historical activity, including churn on complaints",
      "Explored LLM and agentic workflows for internal fraud-detection tooling",
      "Built data-driven alerting for risk prevention and mitigation (in-app loopholes, catastrophic alerting)",
    ],
  },
  {
    title: "Algorithm/AI Engineer",
    org: "TikTok",
    location: "Jakarta, Indonesia",
    year: "Feb 2024 - Jul 2024",
    points: [
      "Harmonized cross-platform search algorithms and system architectures between Tokopedia and TikTok Shop post-acquisition, fine-tuning retrieval models with local marketplace nuances to drive a 2% lift in search relevance",
      "Spearheaded core phases of TikTok's end-to-end ML lifecycle, designing and scaling pipelines for data streaming, automated model training, search indexing, and high-dimensional Vector DB infrastructure",
    ],
  },
  {
    title: "Data Scientist",
    org: "Tokopedia",
    location: "Jakarta, Indonesia",
    year: "Sep 2021 - Jul 2024",
    points: [
      "Architected Query Understanding algorithms for Search Personalization, uplifting search relevance and conversion by 2%, gross transaction value by 2%, and growing monthly ads revenue",
      "Engineered a multi-label Query-to-Product Type assortment system for IR pre-filtering, driving a 4% surge in conversions, 2% transaction-value growth, and additional monthly ads revenue",
      "Scaled deep learning and LLM solutions in production (real-time classifiers, LLM automated labelers), leveraging model distillation and quantization to cut latency and compute costs by 50% while maintaining >99% of baseline accuracy",
    ],
  },
  {
    title: "Data Scientist",
    org: "Pashouses",
    location: "Jakarta, Indonesia",
    year: "Nov 2020 - Sep 2021",
    points: [
      "Engineered a multi-modal Automated Valuation Model (AVM) for regional housing prices using tabular, text, and image data, keeping error rate <9% while accelerating processing throughput 10-fold",
      "Designed end-to-end data engineering and ETL pipelines for property analytics, cutting manual data ingestion by ~70% while maintaining >90% system reliability",
    ],
  },
];

export const projects = [
  {
    title: "ID ASR Dataset Generator",
    href: "https://github.com/sabilmakbar/yt_idsub_generator",
    year: "2023",
    points: [
      "v0 Indonesian ASR (automatic subtitle recognition) dataset built from news-channel videos",
      "End-to-end ETL pipeline; langdetect-based subtitle cleansing (inspired by the C4 construction)",
    ],
  },
  {
    title: "ID NN-based Splitter",
    href: "https://github.com/sabilmakbar/id_nnsplit_train",
    year: "2023",
    points: [
      "Adapted <a class='underline decoration-accent' href='https://github.com/bminixhofer/wtpsplit' target='_blank' rel='noopener'>wtpsplit (formerly NNSplit)</a> to Indonesian data",
    ],
  },
];

export const academicInterests = [
  {
    title: "Bringing modern NLP to Indonesian & its local languages",
    items: [
      "LLMs underperform on low-resource languages due to scarce data",
      "Many Indonesian local-language resources remain untapped by modern NLP",
      "Contributing to projects (with talented collaborators across Indonesia) that address this gap",
    ],
  },
  {
    title: "Expanding generic NLP toolkits",
    items: [
      "Widely-used NLP toolkits often lack Indonesian and local-language support",
      "Aiming to help democratize tooling and knowledge across languages",
    ],
  },
  {
    title: "Low-resource NLP research",
    items: [
      "Several Indonesian local languages are syntactically transferable from Indonesian without major semantic degradation",
      "Dedicated to bridging NLP into low-resource languages via this approach",
      "Aspiring to pursue a higher degree in an environment that enables driving this vision",
    ],
  },
];

export const otherInterests = [
  "Cracking math problems; I still enjoy the challenge of proving or disproving a statement",
  "Writing tidy, self-explainable code (self-taught, coming from a non-CS background)",
  "Truly end-to-end deployments built by hand (with a little help from Stack Overflow / ChatGPT)",
  'Finding the beauty of mathematics as a "language" for the real world, whether in DS, ML & AI, or the social sciences',
];
