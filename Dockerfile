FROM node:18-alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
WORKDIR /usr/src/app

COPY package*.json ./
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --omit=dev --ignore-scripts; \
    else \
      npm ci --ignore-scripts; \
    fi

COPY . .

EXPOSE 3000
USER node
CMD ["npm", "run", "start:prod"]