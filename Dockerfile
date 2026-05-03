FROM node:20-slim

# Install curl (for health checks) and ngrok binary
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar xz -C /usr/local/bin && chmod +x /usr/local/bin/ngrok

WORKDIR /app

# Copy package files first (better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app
COPY . .

# Expose Metro bundler port
EXPOSE 8081

# Inject ngrok auth token from secret, then start Expo with tunnel
CMD sh -c "ngrok config add-authtoken $NGROK_AUTHTOKEN 2>/dev/null || true && npx expo start --tunnel --host 0.0.0.0 --non-interactive"