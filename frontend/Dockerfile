FROM node:18-alpine
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN echo "Using API: $REACT_APP_API_URL" && npm run build
CMD ["npx", "serve", "-s", "build"]
