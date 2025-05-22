#!/bin/bash

set -e

echo "🚀 Starting Minikube..."
echo "🗑️ Deleting existing Minikube instance, if any..."
minikube delete --all --purge || true
minikube start --driver=docker --cpus=4 --memory=4096

echo "🐳 Building local Docker images for Valiax (host network for pip)…"

docker build --network=host -t backend:latest ../backend
#docker build --network=host --build-arg REACT_APP_API_URL="http://localhost:8000" -t frontend:latest ../frontend
docker build --network=host -t worker:latest ../worker
# Build rule-runner image
docker build --network=host -t rule-runner:latest ../worker/runner
#docker build --network=host -t llm_service:latest ../llm_service

echo "🐋 Loading images into Minikube…"
minikube image load backend:latest
#minikube image load frontend:latest
minikube image load worker:latest
# Load rule-runner image into Minikube
minikube image load rule-runner:latest
#minikube image load llm_service:latest

echo "📑 Creating ConfigMap for init scripts…"
kubectl create configmap backend-initdb --from-file=../backend/initdb --dry-run=client -o yaml | kubectl apply -f -

echo "🔧 Installing Argo Workflows controller..."
# Create Argo Workflows namespace if it does not exist
kubectl create namespace argo || true
# Install Argo Workflows controller and CRDs
kubectl apply -n argo -f https://github.com/argoproj/argo-workflows/releases/download/v3.5.6/install.yaml

echo "📜 Applying Argo workflow definition..."
# Apply Workflow/CronWorkflow YAML from infra folder
kubectl apply -f argo-run-rules-workflow.yaml

echo "📦 Applying Kubernetes deployments..."

echo "🐍 Building list-due-rules image..."
docker build --network=host -t list-due-rules:latest ./scripts

echo "🐋 Loading list-due-rules image into Minikube…"
minikube image load list-due-rules:latest
kubectl apply -f deployment.yml
echo "🌐 Applying rule-runner service..."
kubectl apply -f rule-runner-service.yaml
kubectl apply -f rule-runner-deployment.yaml

echo "⏳ Waiting for pods..."
echo "⏳ Waiting for backend rollout (up to 120s)..."
kubectl rollout status deployment/backend --timeout=120s
#kubectl wait --for=condition=available --timeout=60s deployment/frontend

# Wait for worker deployment
kubectl wait --for=condition=available --timeout=60s deployment/worker

# Wait for LLM service deployment
#kubectl wait --for=condition=available --timeout=60s deployment/llm-service

# Wait for ecommerce-db-1 deployment
kubectl wait --for=condition=available --timeout=60s deployment/ecommerce-db-1

# Wait for ecommerce-db-2 deployment
kubectl wait --for=condition=available --timeout=60s deployment/ecommerce-db-2

echo "🔀 Port-forward backend: localhost:8000 → backend"
nohup kubectl port-forward svc/backend 8000:8000 >/dev/null 2>&1 &
echo "🌐 Opening frontend in browser..."
#minikube service frontend