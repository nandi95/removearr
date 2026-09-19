# build on the native arch: .output is plain JS, so the arm64 image only needs the COPY below
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8484
COPY --from=build /app/.output ./.output
# sqlite lives here; mount it to keep history across upgrades
RUN mkdir -p .data && chown node:node .data
USER node
VOLUME /app/.data
EXPOSE 8484
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:8484/ >/dev/null || exit 1
CMD ["node", ".output/server/index.mjs"]
