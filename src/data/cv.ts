export const education = [
  {
    title: "Bachelor of Science in Mathematics, Cum Laude",
    org: "Bandung Institute of Technology (ITB)",
    location: "Bandung, Indonesia",
    year: "Aug 2016 - Sep 2020",
    points: [
      "Thesis: Computational Fluid Dynamics of Wave Propagation using Shallow Water Equations",
      "Relevant coursework: Computational Mathematics, Mathematical Optimization, Mathematical Statistics, Probability Theory",
    ],
  },
];

export const experience = [
  {
    title: "ML Research Engineer",
    org: "Stealth AI Startup",
    location: "Kuala Lumpur, Malaysia",
    year: "Oct 2024 - present",
    points: [
      "Researched, fine-tuned, and deployed multilingual ASR and TTS models for production Speech AI across APAC and MENA languages, improving quality against strong open-source baselines",
      "Built an internal speech-model benchmarking platform for hosted and local models across WER, CER, MOS, RTF, throughput, and GPU utilization",
      "Evaluated and integrated denoising, LID, VAD, and turn detection into LiveKit-based voice systems",
      "Built an internal speech-model training platform spanning data versioning, training, resource allocation, evaluation, and benchmarking; co-developed an LLM-as-a-Judge pipeline for multi-ASR auto-labeling and human-in-the-loop routing",
    ],
  },
  {
    title: "Algorithm Engineer",
    org: "TikTok",
    location: "Jakarta, Indonesia",
    year: "Feb 2024 - Jul 2024",
    points: [
      "Harmonized search and retrieval systems across Tokopedia and TikTok Shop after the acquisition, adapting models to Indonesian marketplace data, taxonomy, and user behavior; developed a graph-embedding retrieval approach that improved search relevance and conversion",
      "Migrated search use cases to TikTok's production ML platform, validating cross-platform data integrity and adapting workflows for automated training, embedding generation, vector-index updates, and retrieval indexing",
    ],
  },
  {
    title: "Data Scientist",
    org: "Tokopedia",
    location: "Jakarta, Indonesia",
    year: "Sep 2021 - Jul 2024",
    points: [
      "Led Query Understanding for search personalization, combining query semantics and behavioral signals to model intent, attributes, and browse-versus-buy behavior, improving relevance, conversion, and transaction value",
      "Co-developed a multi-label deep-learning query classifier over the product-category taxonomy for pre-retrieval and coarse-to-fine ranking",
      "Optimized query classification for production through model distillation and quantization, reducing latency while retaining baseline performance and integrating with existing inference platforms",
    ],
  },
  {
    title: "Data Scientist",
    org: "Pashouses",
    location: "Jakarta, Indonesia",
    year: "Nov 2020 - Sep 2021",
    points: [
      "Built and deployed an Automated Valuation Model for residential properties in Greater Jakarta, combining tabular and geospatial data with computer-vision-derived property-condition scores",
      "Built computer-vision and data-processing workflows for property collection, including visual listing deduplication, OCR-based geolocation extraction, and automated ingestion and feature pipelines",
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
