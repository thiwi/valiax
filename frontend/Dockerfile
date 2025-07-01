FROM node:18-alpine
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
RUN npm install -g serve

COPY . .

RUN echo "Using API: $REACT_APP_API_URL" && npm run build
# 'serve' 14+ expects a scheme prefix for the --listen argument. Without the
# "tcp://" prefix the value is parsed as a URL and results in an error like
# "Unknown --listen endpoint scheme". Prefix with "tcp://" so the frontend can
# bind correctly on port 3000 when deployed in Kubernetes.
CMD ["serve", "-s", "build", "--listen", "tcp://0.0.0.0:3000"]
