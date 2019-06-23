# Primer stage, con el node_modules
FROM node:10-alpine as builder

# Por defecto construimos para producción, pero si queremos construir
# para desarollo le pasamos "development" como variable de entorno
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apk --no-cache add python make g++

# Primero hacemos el copy del package.json y el npm ci para que docker genere
# una capa con ese paso.
COPY package*.json ./
RUN npm ci

# Segundo stage, solo con la app
FROM node:10-alpine

WORKDIR /usr/src/app
COPY --from=builder node_modules node_modules

COPY . .

CMD [ "npm", "run", "start:prod" ]