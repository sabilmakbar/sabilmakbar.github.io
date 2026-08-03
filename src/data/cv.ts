export const education = [
  {
    title: "Bachelor of Mathematics",
    org: "Bandung Institute of Technology (ITB)",
    year: "2016-2020",
    points: [
      "Thesis: Computational Fluid Dynamics for Wave Propagation using the Shallow Water Equation",
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
      "Fine-tuned cross-domain Speech & Text models with LLM-RAG integration for Voice Assistants, substantially reducing error rates against open-source baselines for APAC and MENA languages",
      "Engineered and deployed high-throughput, low-latency audio pipeline modules (Transcription, LID, VAD, Emotion Detection, Audio Spectrogram Transformers), optimizing inference for scalable production Voice Agent frameworks",
      "Overhauled Active Learning pipelines using LLM-assisted auto-labeling and human-in-the-loop verification, scaling up dataset coverage and annotation accuracy",
      "Built end-to-end data and training automation loops, leveraging DVC and GitHub Actions for event-triggered CI/CD orchestration and rapid, reproducible ML experimentation",
    ],
  },
  {
    title: "Data Scientist",
    org: "Stealth Startup",
    location: "Remote",
    year: "Sep 2024 - Dec 2024",
    points: [
      "Detected and tackled fraudulent activity, reducing customer complaints and averting recurring monthly losses",
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
      "Harmonized cross-platform search algorithms and system architectures between Tokopedia and TikTok Shop post-acquisition, fine-tuning retrieval models with local marketplace nuances to lift search relevance",
      "Spearheaded core phases of TikTok's end-to-end ML lifecycle, designing and scaling pipelines for data streaming, automated model training, search indexing, and high-dimensional Vector DB infrastructure",
    ],
  },
  {
    title: "Data Scientist",
    org: "Tokopedia",
    location: "Jakarta, Indonesia",
    year: "Sep 2021 - Jul 2024",
    points: [
      "Architected Query Understanding algorithms for Search Personalization, lifting search relevance, conversion, gross transaction value, and monthly ads revenue",
      "Engineered a multi-label Query-to-Product Type assortment system for IR pre-filtering, driving gains in conversions, transaction value, and monthly ads revenue",
      "Scaled deep learning and LLM solutions in production (real-time classifiers, LLM automated labelers), leveraging model distillation and quantization to cut latency and compute cost while holding baseline accuracy",
    ],
  },
  {
    title: "Data Scientist",
    org: "Pashouses",
    location: "Jakarta, Indonesia",
    year: "Nov 2020 - Sep 2021",
    points: [
      "Engineered a multi-modal Automated Valuation Model (AVM) for regional housing prices using tabular, text, and image data, keeping the error rate low while greatly accelerating processing throughput",
      "Designed end-to-end data engineering and ETL pipelines for property analytics, cutting manual data ingestion effort while keeping the system reliable",
    ],
  },
];

export const awards = [
  {
    title: "Best Resource Paper, NusaWrites",
    org: "AACL",
    year: "2023",
  },
  {
    title: "Top 1-3%, Telkomsel Indonesia Data Science Competition",
    org: "Jakarta, Indonesia",
    year: "2021",
  },
  {
    title: "Bronze Award, Regional Quant Challenge",
    org: "WorldQuant, Jakarta, Indonesia",
    year: "2019",
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
