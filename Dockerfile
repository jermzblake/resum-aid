ARG BUN_VERSION=1.3.2
FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --ci

FROM oven/bun:${BUN_VERSION}-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
# Build Tailwind CSS into public
RUN bunx @tailwindcss/cli -i ./src/style.css -o ./public/style.css

FROM oven/bun:${BUN_VERSION}-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV LLM_PROVIDER=ollama
ENV OLLAMA_MODEL=gpt-oss:120b-cloud
ENV OPENAI_MODEL=gpt-4o-mini
COPY --from=build /app /app
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD curl -fsS http://localhost:4000/ping || exit 1
CMD ["bun", "run", "src/index.ts"]
