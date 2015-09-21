FROM node:latest

WORKDIR /opt

COPY package.json ./

RUN npm install

ENV NODE_PATH /opt/node_modules:$NODE_PATH

VOLUME ["/opt/app"]

ENTRYPOINT ["npm", "test"]
