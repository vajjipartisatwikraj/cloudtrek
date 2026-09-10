# Small production image for the Express API.
FROM node:20-alpine

WORKDIR /app

# Install only runtime dependencies; package-lock.json is used when present.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# The application listens on PORT, defaulting to 4000.
EXPOSE 4000

CMD ["node", "src/index.js"]