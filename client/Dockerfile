# client/Dockerfile
FROM denoland/deno:debian AS builder

RUN apt-get update && apt-get install -y libc6 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json deno.lock* ./
RUN deno install
COPY . .

ENV VITE_API_URL="https://coffeebud-server.fly.dev/api"
ENV VITE_WS_URL="wss://coffeebud-server.fly.dev/ws"

RUN deno task build

FROM caddy:alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile