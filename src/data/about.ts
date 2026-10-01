// About-page bio content. Kept as data so both the page and the QA chatbot
// index (build-index.ts) draw from the same source.
// Phrases the hero tagline cycles through. First one is the static fallback.
export const taglines = [
  "AI/ML Engineer · Speech AI · NLP · Information Retrieval",
  "NLP · Speech · Information Retrieval",
  "Turning data into production AI systems",
  "Applied mathematics, in production",
];

export const about = {
  summary:
    "AI/ML Engineer with 6 years of experience building production systems across Speech, NLP and Information Retrieval, Computer Vision, and Tabular ML. Experienced across the ML lifecycle, from research and experimentation to data pipelines, model optimization, deployment, and observability.",
  coreExperience: [
    {
      label: "Production Systems",
      text: "Built property valuation models, improved search relevance, and deployed multilingual speech models and scalable ML pipelines into production.",
    },
    {
      label: "Experiment Design & Impact Measurement",
      text: "Designed evaluation setups and measured the quantitative impact of model changes on relevance, conversion, and key business metrics at scale.",
    },
    {
      label: "Generative AI & Voice",
      text: "Currently researching, fine-tuning, evaluating, and deploying multilingual ASR and TTS models alongside training and benchmarking platforms for production voice systems.",
    },
    {
      label: "Research",
      text: "Published at EMNLP, ACL, and AACL on multilingual and low-resource NLP.",
    },
  ],
  // Directions I want to grow into, not past industry work.
  exploring: [
    {
      label: "Trustworthy AI",
      text: "Actively growing into Explainable AI and Causal Inference, working toward AI that is trustworthy and interpretable.",
    },
  ],
  // Tech grouped by where it was used, rather than a flat buzzword list.
  keywords: [
    {
      group: "Voice AI (current role)",
      items: "Python, PyTorch, Hugging Face, NeMo, FastAPI, vLLM, Triton, NVIDIA NIM/Riva, LiveKit, AWS, Docker, Kubernetes, DVC, GitHub Actions",
    },
    {
      group: "Search & IR (Tokopedia, TikTok)",
      items: "Query understanding, graph embeddings, retrieval & ranking, vector databases, model distillation & quantization, TensorFlow, SQL, Airflow, GCP",
    },
    {
      group: "Proptech (Pashouses)",
      items: "Tabular and geospatial modeling, computer vision, OCR, ETL pipelines, PostgreSQL, GCP",
    },
    {
      group: "Mathematics & teaching",
      items: "Applied mathematics, statistics, MATLAB, R",
    },
  ],
};
