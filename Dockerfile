FROM oven/bun:1.4.3 AS bun
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_APIP_AUTH_ORIGINS
RUN bun run build

FROM node:24-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates && rm -rf /var/lib/apt/lists/*
COPY server/adr/requirements-pdf.txt /tmp/requirements-pdf.txt
RUN python3 -m venv /opt/apip-pdf && /opt/apip-pdf/bin/pip install --no-cache-dir -r /tmp/requirements-pdf.txt
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server/adr/pdf_form.py ./server/adr/pdf_form.py
RUN mkdir -p docs/adr/templates
ENV NODE_ENV=production APIP_HOST=0.0.0.0 APIP_PORT=3000 APIP_ACCOUNT_MODE=cloud APIP_PDF_PYTHON=/opt/apip-pdf/bin/python PYTHONDONTWRITEBYTECODE=1
USER node
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
