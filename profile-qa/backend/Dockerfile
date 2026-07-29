# HF Spaces (Docker SDK) — built and run by Hugging Face, not locally.
# Serves the FastAPI app on port 7860 (the port HF routes the Space URL to).
FROM python:3.11-slim

# build tools for llama-cpp-python (compiles from source if no wheel matches)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential cmake git \
    && rm -rf /var/lib/apt/lists/*

# HF Spaces run as uid 1000 — set up a matching non-root user
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/.cache/huggingface

WORKDIR $HOME/app

# copy project (code + prebuilt data/index.npz + data/chunks.json) and install
COPY --chown=user . $HOME/app
RUN pip install --no-cache-dir --user -e '.[serve]'

# bake the GGUF weights into the image so cold starts don't re-download (~1 GB)
RUN python -c "from huggingface_hub import hf_hub_download as d; \
d(repo_id='Qwen/Qwen2.5-1.5B-Instruct-GGUF', filename='qwen2.5-1.5b-instruct-q4_k_m.gguf')"

EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
