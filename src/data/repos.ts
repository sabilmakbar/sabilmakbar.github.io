export interface Repo {
  repo: string; // owner/name
  desc: string;
}

export const repos: Repo[] = [
  {
    repo: "sabilmakbar/yt_idsub_generator",
    desc: "Indonesian ASR / subtitle dataset generator from YouTube news videos, with an end-to-end ETL pipeline.",
  },
  {
    repo: "indonlp/nusa-writes",
    desc: "NusaWrites: high-quality corpora for underrepresented & extremely low-resource Indonesian languages.",
  },
  {
    repo: "sabilmakbar/id_nnsplit_train",
    desc: "Training for a neural sentence splitter adapted to Indonesian data (wtpsplit-based).",
  },
];
