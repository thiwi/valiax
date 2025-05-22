#!/bin/bash

set -e

echo "🛑 Stopping Valiax environment..."

echo "🗑️ Deleting Kubernetes deployments and services..."
kubectl delete -f rule-runner-service.yaml || true
kubectl delete -f deployment.yml || true
kubectl delete configmap backend-initdb || true
kubectl delete namespace argo || true

echo "🧹 Cleaning up Docker images from Minikube..."
minikube image rm backend:latest || true
minikube image rm worker:latest || true
minikube image rm rule-runner:latest || true
minikube image rm llm_service:latest || true

echo "🛑 Stopping Minikube..."
minikube delete --all --purge || true

echo "✅ All services stopped and Minikube cleaned up."