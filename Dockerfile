# Use a base image with Node.js pre-installed
FROM node:bullseye-slim

WORKDIR /app

COPY package.json ./
COPY build ./build

# Expose the specified port
EXPOSE 8080

# Start the Node.js application
CMD ["npm", "start", "8080"]