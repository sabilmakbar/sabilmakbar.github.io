// About-page bio content. Kept as data so both the page and the QA chatbot
// index (build-index.ts) draw from the same source.
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
      text: "Designed experiments and A/B tests, and measured the quantitative impact of model changes on relevance, conversion, and key business metrics at scale.",
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
  keywords: [
    { group: "Domains", items: "NLP, Speech & Voice AI, Information Retrieval, Computer Vision, Tabular Data" },
    {
      group: "Methodologies",
      items: "LLMs & RAG, Applied Mathematics, Deep Learning",
    },
    {
      group: "Infrastructure & Tools",
      items: "Python, Cloud & MLOps (Docker, Kubernetes, Airflow), Vector Databases, Scalable AI Systems",
    },
  ],
};
