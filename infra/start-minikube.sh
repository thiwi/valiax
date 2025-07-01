# start-minikube.sh: Script to set up a local Minikube cluster, build Docker images,
# load them into Minikube, and deploy the Valiax application stack into the ‘valiax’ namespace.
#!/bin/bash

# Exit immediately if any command fails (non-zero exit)
set -e

# Determine the directory where this script resides for relative path resolution
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Define path to the Kubernetes manifest that contains all resource definitions
DEPLOYMENT_FILE="$SCRIPT_DIR/deployment.yml"


echo "🚀 Starting Minikube..."
# Clean up any existing Minikube instance to ensure a fresh environment
# echo "🗑️ Deleting existing Minikube instance, if any..."
# minikube delete --all --purge || true

# Start Minikube with Docker driver and allocate CPU/memory resources
minikube start --driver=docker --cpus=4 --memory=4096

# Configure kubectl to target the Minikube cluster and use the ‘valiax’ namespace
kubectl config use-context minikube
kubectl create namespace valiax || true
kubectl config set-context --current --namespace=valiax


# Build local Docker images for components and load them into Minikube’s Docker daemon
echo "🐳 Building and loading Docker images…"
# List of images to build: tag and corresponding source directory
declare -a IMAGES=(
  "backend:latest ../backend"
  "worker:latest ../worker"
  "rule-runner:latest ../runner"
  "frontend:latest ../frontend"
#  "llm-service:latest ../llm_service"
)
# Iterate over each image entry, build and load into Minikube
for entry in "${IMAGES[@]}"; do
  read -r TAG DIR <<< "$entry"
  echo "  • Building $TAG from $DIR..."
  docker build --network=host -t "$TAG" "$SCRIPT_DIR/$DIR"
  echo "  • Loading $TAG into Minikube..."
  minikube image load "$TAG"
done

# Create or update ConfigMap for backend initialization scripts
echo "📑 Creating ConfigMap for init scripts…"
kubectl create configmap backend-initdb --from-file=../backend/initdb --dry-run=client -o yaml | kubectl apply -f -

# Apply all Kubernetes resource definitions from the deployment manifest
echo "📦 Applying Kubernetes deployments..."

kubectl apply -f "$DEPLOYMENT_FILE"

# Wait for all core deployments to become available before proceeding
echo "⏳ Waiting for deployments to be available…"
declare -a WAIT_DEPLOYMENTS=(backend worker celery-beat ecommerce-db-1 ecommerce-db-2 rule-runner)
for dep in "${WAIT_DEPLOYMENTS[@]}"; do
  echo "  • $dep"
  kubectl rollout status deployment/"$dep" --timeout=120s
done

# Forward backend service port to localhost for local access
echo "🔀 Port-forward backend: localhost:8000 → backend"
nohup kubectl port-forward svc/backend 8000:8000 >/dev/null 2>&1 &

# Notify user that the frontend is being opened in the default browser
echo "🌐 Opening frontend in browser..."