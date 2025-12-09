To install dependencies:

```sh
bun install
```

## Resum-Aid

A Bun/Hono app to analyze resume bullets, match jobs, and build tailored resumes. The containerized app is cloud-only for LLMs (Ollama Cloud or OpenAI). For local Ollama, run the app without containers.

### Quick Start (Cloud Containers)

```zsh
# Choose provider
export LLM_PROVIDER=ollama
export OLLAMA_HOST=https://ollama.com
export OLLAMA_API_KEY=oclk-...
export OLLAMA_MODEL=gpt-oss:120b-cloud

# Build and run
docker compose build
docker compose up -d

# Health check
curl http://localhost:4000/ping
```

Open http://localhost:4000

### Using OpenAI (Cloud Containers)

```zsh
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o-mini
docker compose up -d
```

### Local Dev (No Containers, Local Ollama)

```zsh
bun install
export LLM_PROVIDER=ollama
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL=gpt-oss:120b-cloud
bun run dev
```

### Environment

- `LLM_PROVIDER`: `ollama` | `openai` (default: `ollama`)
- `PORT`: web server port (default `4000`)
- `OLLAMA_HOST`: e.g., `https://api.ollama.com` (cloud) or `http://localhost:11434` (local)
- `OLLAMA_MODEL`: default `gpt-oss:120b-cloud`
- `OLLAMA_API_KEY`: required for Ollama Cloud
- `OPENAI_API_KEY`: required when `LLM_PROVIDER=openai`
- `OPENAI_MODEL`: default `gpt-4o-mini`

### Notes

- Tailwind CSS builds during image build to `public/style.css`.
- Health endpoint: `GET /ping`.
