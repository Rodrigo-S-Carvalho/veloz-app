FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
#RUN npm ci --only=production
RUN npm install --only=production

COPY . .

USER node

EXPOSE 8081

CMD ["node", "server.js"]