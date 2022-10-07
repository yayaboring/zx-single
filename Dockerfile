FROM node:16-buster-slim

RUN apt-get update && apt-get install -y gcc g++ make p7zip-full git

RUN cd /root && git clone https://github.com/google/zx.git && cd zx

WORKDIR /root/zx

RUN npm i && npm run build

ADD *.js .

RUN node ./build/cli.js a.js && node ./build/cli.js b.js
