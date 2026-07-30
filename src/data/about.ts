// About-page bio content. Kept as data so both the page and the QA chatbot
// index (build-index.ts) draw from the same source.
// Phrases the hero tagline cycles through. First one is the static fallback.
export const taglines = [
  "AI & Machine Learning Engineer",
  "NLP · Speech · Information Retrieval",
  "Turning data into production AI systems",
  "Applied mathematics, in production",
];

export const about = {
  summary:
    "AI professional with ~5 years of experience in Data Science & Machine Learning, applying a strong mathematics foundation to deliver end-to-end AI solutions across NLP, Speech, Computer Vision, and Tabular domains. Experienced in both startups and multinational corporations.",
  coreExperience: [
    {
      label: "Production Systems",
      text: "Developed pricing models from scratch, improved search relevance, built fraud detection systems, and deployed scalable, long-lasting ML models into production.",
    },
    {
      label: "Experiment Design & Impact Measurement",
      text: "Designed evaluation setups and measured the quantitative impact of model changes on relevance, conversion, and key business metrics at scale.",
    },
    {
      label: "Generative AI & Voice",
      text: "Currently building and fine-tuning Speech & Text models with LLM-RAG integration, alongside pipelines for real-world voice AI applications.",
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
      items: "Python, LLMs & RAG, vLLM, Speech & audio models, FastAPI, AWS, Docker, Kubernetes, Airflow, DVC",
    },
    {
      group: "Search & IR (Tokopedia, TikTok)",
      items: "Query understanding, retrieval & ranking, Vector Databases, model distillation & quantization, Airflow, GCP",
    },
    {
      group: "Fraud & Risk (fintech startup)",
      items: "Graph Data Science (Neo4j), anomaly and network analysis, SQL, Airflow",
    },
    {
      group: "Proptech (Pashouses)",
      items: "Multimodal modeling (tabular, text, image), ETL pipelines, GCP",
    },
    {
      group: "Mathematics & teaching",
      items: "Applied mathematics, statistics, MATLAB, R",
    },
  ],
};
