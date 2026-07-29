export interface Pub {
  title: string;
  authors: string;
  venue: string;
  year: number;
  url?: string;
  selected?: boolean;
}

// "Salsabil" / "Akbar" is highlighted in the UI where it appears in `authors`.
export const publications: Pub[] = [
  {
    title: "SEACrowd: A Multilingual Multimodal Data Hub and Benchmark Suite for Southeast Asian Languages",
    authors:
      "Holy Lovenia, Rahmad Mahendra, Salsabil Maulana Akbar, Samuel Cahyawijaya, Genta Indra Winata, et al.",
    venue: "EMNLP (Main)",
    year: 2024,
    url: "https://aclanthology.org/2024.emnlp-main.296",
    selected: true,
  },
  {
    title: "Cendol: Open Instruction-tuned Generative Large Language Models for Indonesian Languages",
    authors:
      "Samuel Cahyawijaya, Holy Lovenia, Fajri Koto, Rifki Afina Putri, Emmanuel Dave, Jhonson Lee, Nuur Shadieq, Wawan Cenggoro, Salsabil Maulana Akbar, et al.",
    venue: "arXiv",
    year: 2024,
    url: "https://api.semanticscholar.org/CorpusID:269009450",
    selected: true,
  },
  {
    title: "NusaWrites: Constructing High-Quality Corpora for Underrepresented and Extremely Low-Resource Languages",
    authors:
      "Samuel Cahyawijaya, Holy Lovenia, Fajri Koto, Dea Adhista, Emmanuel Dave, Sarah Oktavianti, Salsabil Akbar, et al.",
    venue: "IJCNLP-AACL",
    year: 2023,
    url: "https://aclanthology.org/2023.ijcnlp-main.60",
    selected: true,
  },
  {
    title: "Assessment of Fire Stations Distribution Using Geographic Information System, Case Study in Jakarta Pusat",
    authors: "Fathin Nurzaman, Malvin Napitupulu, Salsabil Akbar",
    venue: "",
    year: 2022,
  },
];
