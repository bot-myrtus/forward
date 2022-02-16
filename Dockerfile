FROM node:bullseye-slim

RUN apt update && apt -y install python3 build-essential && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/log/*
WORKDIR /usr/src/app
COPY ./package*.json ./

ENV NODE_ENV production
RUN npm ci && npm cache clean --force

EXPOSE 8080
CMD [ "npm", "start" ]
