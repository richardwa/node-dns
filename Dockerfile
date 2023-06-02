# Use a base image with Node.js pre-installed
FROM node:bullseye-slim

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY build ./build

RUN npm ci && npm cache clean --force

# Expose the specified port
EXPOSE 8080

CMD ["node","./build/server/server.js", "8080"]