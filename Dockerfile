FROM node:latest

WORKDIR /opt

COPY package.json ./

RUN npm install

ENV PATH /opt/node_modules/mocha/bin:$PATH

VOLUME ["/opt/app"]

ENTRYPOINT ["npm", "test"]
