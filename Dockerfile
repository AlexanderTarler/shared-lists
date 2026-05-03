FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Install ngrok binary (required by expo --tunnel)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* \
    && curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar xz -C /usr/local/bin

# Install Expo ngrok wrapper (prevents interactive prompt)
RUN npm install -g @expo/ngrok

COPY . .

EXPOSE 8081

# Start Expo with tunnel mode (injects ngrok token from Fly secret)
CMD sh -c "ngrok config add-authtoken $NGROK_AUTHTOKEN 2>/dev/null || true && CI=1 npx expo start --tunnel"