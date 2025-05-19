#!/usr/bin/env bash
set -e

# Argument parsing for test skip
SKIP_BACKEND=false
SKIP_FRONTEND=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-backend) SKIP_BACKEND=true; shift ;;  # Backend-Tests überspringen
    --skip-frontend) SKIP_FRONTEND=true; shift ;;  # Frontend-Tests überspringen
    *) echo "Unbekannte Option: $1"; exit 1 ;;
  esac
done


echo "🚀 Starte Tests in Minikube..."
echo "🚀 Starte Minikube..."
minikube delete --all --purge || true
minikube start --driver=docker --cpus=4 --memory=4096

# Ensure we are using the Minikube context
kubectl config use-context minikube

echo "📑 Erstelle Namespace valiax-test (falls nicht vorhanden)..."
kubectl create namespace valiax-test --dry-run=client -o yaml | kubectl apply -f -
echo "📑 Setze aktuellen Namespace auf valiax-test..."
kubectl config set-context --current --namespace=valiax-test

echo "📑 Erstelle ConfigMap für Init-Skripte..."
kubectl create configmap backend-initdb --from-file=../backend/initdb --dry-run=client -o yaml | kubectl apply -f -

echo "🐳 Baue lokale Docker-Images..."
docker build --network=host -f ../backend/Dockerfile.test -t backend:latest ../backend
docker build --network=host -t frontend:latest ../frontend
docker build --network=host -t worker:latest ../worker
# Optional: llm_service
# docker build --network=host -t llm_service:latest ../llm_service

echo "🐋 Lade Images in Minikube..."
minikube image load backend:latest
minikube image load frontend:latest
minikube image load worker:latest
# Optional: llm_service
# minikube image load llm_service:latest

echo "📑 Wende Test-Jobs an..."
kubectl apply --validate=false -f test-jobs.yml

# Wait for test-backend container to finish
if [ "$SKIP_BACKEND" = true ]; then
  echo "⚠️ Überspringe Backend-Tests"  
  kubectl delete job test-backend || true
else
  echo "⏳ Warte auf Abschluss des Containers 'test-backend'..."
  POD_BACKEND=$(kubectl get pods -l job-name=test-backend -o jsonpath='{.items[0].metadata.name}')
  START=$(date +%s)
  while true; do
    CODE=$(kubectl get pod $POD_BACKEND -o jsonpath='{.status.containerStatuses[?(@.name=="test-backend")].state.terminated.exitCode}')
    if [ "$CODE" = "0" ]; then
      echo "✅ Container 'test-backend' erfolgreich abgeschlossen. Logs:"
      kubectl logs $POD_BACKEND -c test-backend
      break
    elif [ -n "$CODE" ]; then
      echo "❌ Container 'test-backend' mit Exit-Code $CODE. Logs:"
      kubectl logs $POD_BACKEND -c test-backend
      exit $CODE
    fi
    NOW=$(date +%s)
    if [ $((NOW - START)) -ge 180 ]; then
      echo "❌ Timeout nach 180 Sekunden beim Warten auf 'test-backend'. Logs beider Container:"
      kubectl logs $POD_BACKEND -c test-backend
      kubectl logs $POD_BACKEND -c postgres
      exit 1
    fi
    sleep 1
  done
  # Cleanup
  kubectl delete job test-backend
fi

# Wait for test-frontend container to finish
if [ "$SKIP_FRONTEND" = true ]; then
  echo "⚠️ Überspringe Frontend-Tests"
  kubectl delete job test-frontend || true
  echo "🎉 Alle Tests abgeschlossen!"
else
  echo "⏳ Warte auf Abschluss des Containers 'test-frontend'..."
  POD_FRONTEND=$(kubectl get pods -l job-name=test-frontend -o jsonpath='{.items[0].metadata.name}')
  START_F=$(date +%s)
  while true; do
    CODE_F=$(kubectl get pod $POD_FRONTEND -o jsonpath='{.status.containerStatuses[?(@.name=="test-frontend")].state.terminated.exitCode}')
    if [ "$CODE_F" = "0" ]; then
      echo "✅ Container 'test-frontend' erfolgreich abgeschlossen. Logs:"
      kubectl logs $POD_FRONTEND -c test-frontend
      break
    elif [ -n "$CODE_F" ]; then
      echo "❌ Container 'test-frontend' mit Exit-Code $CODE_F. Logs:"
      kubectl logs $POD_FRONTEND -c test-frontend
      exit $CODE_F
    fi
    NOW_F=$(date +%s)
    if [ $((NOW_F - START_F)) -ge 600 ]; then
      echo "❌ Timeout nach 600 Sekunden beim Warten auf 'test-frontend'. Logs:"
      kubectl logs $POD_FRONTEND -c test-frontend
      exit 1
    fi
    sleep 1
  done
  # Cleanup jobs
  echo "🧹 Lösche Test-Jobs..."
  kubectl delete job test-backend test-frontend
  echo "🎉 Alle Tests abgeschlossen!"
fi