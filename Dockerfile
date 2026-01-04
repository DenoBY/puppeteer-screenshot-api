FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    fonts-liberation \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/*

WORKDIR /app

COPY package.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm install --omit=dev && npm cache clean --force

COPY server.js ./

ENV PORT=3000 \
    DISPLAY=:99

EXPOSE 3000

CMD ["sh", "-c", "Xvfb :99 -screen 0 1920x1080x24 -ac & sleep 1 && node server.js"]
