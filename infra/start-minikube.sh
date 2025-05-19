#!/bin/bash

set -e

echo "🚀 Starte Minikube..."
echo "🗑️ Lösche bestehende Minikube-Instanz, falls vorhanden..."
minikube delete --all --purge || true
minikube start --driver=docker --cpus=4 --memory=4096

echo "🐳 Baue lokale Docker-Images für Valiax (Host-Netzwerk für pip)…"

docker build --network=host -t backend:latest ../backend
docker build --network=host --build-arg REACT_APP_API_URL="http://localhost:8000" -t frontend:latest ../frontend
docker build --network=host -t worker:latest ../worker
#docker build --network=host -t llm_service:latest ../llm_service

echo "🐋 Lade Images in Minikube…"
minikube image load backend:latest
minikube image load frontend:latest
minikube image load worker:latest
#minikube image load llm_service:latest

echo "📑 Erstelle ConfigMap für Init-Skripte…"
kubectl create configmap backend-initdb --from-file=../backend/initdb --dry-run=client -o yaml | kubectl apply -f -

echo "📦 Wende Kubernetes-Deployments an..."
kubectl apply -f deployment.yml

echo "⏳ Warte auf Pods..."
echo "⏳ Warten auf Backend Rollout (bis zu 120s)..."
kubectl rollout status deployment/backend --timeout=120s
kubectl wait --for=condition=available --timeout=60s deployment/frontend

# Warte auf Worker Deployment
kubectl wait --for=condition=available --timeout=60s deployment/worker

# Warte auf LLM Service Deployment
#kubectl wait --for=condition=available --timeout=60s deployment/llm-service

# Warte auf Ecommerce DB 1 Deployment
kubectl wait --for=condition=available --timeout=60s deployment/ecommerce-db-1

# Warte auf Ecommerce DB 2 Deployment
kubectl wait --for=condition=available --timeout=60s deployment/ecommerce-db-2

echo "🔀 Port-Forward für Backend: localhost:8000 → backend"
nohup kubectl port-forward svc/backend 8000:8000 >/dev/null 2>&1 &
echo "🌐 Öffne Frontend im Browser..."
minikube service frontend