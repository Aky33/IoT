# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend

WORKDIR /app

COPY apps/frontend/package.json ./
RUN npm install

COPY apps/frontend .
RUN npm run build

# --- Stage 2: Backend + static frontend ---
FROM node:20-alpine

WORKDIR /app

COPY apps/backend/package.json ./
RUN npm install --omit=dev

COPY apps/backend/src ./src
COPY --from=frontend /app/dist ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
