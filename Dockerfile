# Use a base image with Node.js pre-installed
FROM node:bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN npm uninstall --save vue vue-router \
    && npm ci --omit=dev && npm cache clean --force
COPY build ./build

# Expose the specified port
EXPOSE 8081
EXPOSE 8053
RUN useradd --uid 1003 --no-create-home --shell /bin/bash mydns
USER mydns
CMD ["node","./build/server/main.js", "8081"]