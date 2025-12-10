## Resum-Aid

An AI-powered resume enhancement tool that analyzes bullet points, matches roles, and assembles tailored resumes with exportable previews. Built with Bun and Hono, styled with Tailwind CSS, and integrates LLMs via Ollama Cloud or OpenAI.

## Live Demo

Production (Fly.io): https://resum-aid.fly.dev/

> If the demo is idle, visiting the URL wakes it.

## Features

- Bullet Analyzer: Evaluate and improve resume bullets with streaming feedback.
- Job Matcher: Compare resume content against job descriptions for fit.
- Resume Builder: Upload, identify gaps, edit, preview, and download PDF.
- Health checks: `GET /ping` for liveness.

## Screens/Pages

- Landing: `src/views/pages/landing.view.ts` → `/`
- Job Matcher: `src/views/pages/job-matcher.view.ts` → `/tools/job-matcher`
- Bullet Analyzer: `src/views/pages/bullet-analyzer.view.ts` → `/tools/bullet-analyzer`
- Resume Builder: `src/views/pages/resume-*` → `/tools/resume-builder`

## Quick Start

### Local Development (no containers, local Ollama)

```zsh
bun install
export LLM_PROVIDER=ollama
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL=gpt-oss:120b-cloud
bun run dev
```

Open `http://localhost:4000`.

### Cloud Containers (Docker Compose)

```zsh
# Choose provider (Ollama Cloud)
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

Using OpenAI:

```zsh
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o-mini
docker compose up -d
```

## Configuration

- Core: `LLM_PROVIDER` (`ollama` | `openai`, default `ollama`), `PORT` (default `4000`)
- Ollama: `OLLAMA_HOST`, `OLLAMA_MODEL` (default `gpt-oss:120b-cloud`), `OLLAMA_API_KEY` (Cloud only)
- OpenAI: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`)

## Tech Stack

- Runtime: Bun (TypeScript)
- Web framework: Hono (server-side routes + views)
- UI/Styles: Tailwind CSS (CLI), minimal custom components
- LLM integration: Ollama Cloud or OpenAI (env-configurable)
- Data & parsing: Mammoth (DOCX → text), unpdf (PDF parsing), jsPDF (PDF generation)
- HTTP & validation: Axios, Zod
- Dev & tooling: Docker Compose, Prettier, Concurrently
- Deployment: Fly.io (`fly.toml`)
- Testing: Bun test

## API Endpoints

- `GET /ping`: health check
- Tool pages served under `/tools/*` (job matcher, bullet analyzer, resume builder)
- Resume builder: preview and download endpoints under `/api/resume/*`

## Testing

```zsh
bun test
bun run test:watch
```

## Deployment

- Fly.io app configured via `fly.toml`.
- Container exposes `4000` and runs Bun server.

## Notes

- Tailwind CSS builds to `public/style.css` during image build.
- For local Ollama, run without containers.
