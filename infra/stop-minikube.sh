#!/bin/bash

set -e

# Absolute path to this script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Path to the Kubernetes manifests file
DEPLOYMENT_FILE="$SCRIPT_DIR/deployment.yml"

# Switch context to 'valiax' namespace for cleanup
kubectl config set-context --current --namespace=valiax

echo "🛑 Stopping Valiax environment..."

echo "🗑️ Deleting Kubernetes deployments and services..."
kubectl delete -f "$DEPLOYMENT_FILE" || true
kubectl delete configmap backend-initdb || true

echo "🧹 Cleaning up Docker images from Minikube..."
minikube image rm backend:latest || true
minikube image rm worker:latest || true

echo "🗑️ Deleting Kubernetes PersistentVolumeClaims and PersistentVolumes..."
kubectl delete pvc --all --namespace valiax || true
kubectl delete pv --all || true

echo "🗑️ Deleting Docker volumes inside Minikube..."
minikube ssh -- docker volume ls -q | xargs -r docker volume rm

echo "🗑️ Pruning unused Docker data inside Minikube..."
minikube ssh -- docker system prune -af

echo "🛑 Stopping Minikube..."
minikube delete --all --purge || true

echo "✅ All services stopped and Minikube cleaned up."