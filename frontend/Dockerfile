FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Debug: zeigt, was tatsächlich im Image gelandet ist
RUN echo "=== Inhalt von /app/src ===" && ls -R /app/src

CMD ["npm", "start"]
