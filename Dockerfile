FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN yarn

COPY ./ /app

RUN yarn build

EXPOSE 3000

CMD [ "yarn", "serve" ]