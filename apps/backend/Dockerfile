FROM --platform=linux/amd64 node:20-alpine

WORKDIR /app

# Install only backend dependencies.
COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]