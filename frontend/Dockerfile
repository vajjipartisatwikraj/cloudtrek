# Build the static Vite bundle in an isolated Node image.
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


# Serve the generated frontend through a small web server image.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Container HTTP port; map this to the host port used by the deployment.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
