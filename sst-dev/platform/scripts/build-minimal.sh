#!/usr/bin/env bash
set -euo pipefail

# Minimal platform build script
# Usage (from repo root):
#   bash platform/scripts/build-minimal.sh
# Or from platform/:
#   bash scripts/build-minimal.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Platform minimal build running in: $ROOT"

# Check for required tools
if ! command -v bun >/dev/null 2>&1; then
  echo "ERROR: bun not found in PATH. Install bun (https://bun.sh/) or run from an environment with bun available." >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found in PATH. Install Node.js or run from an environment with node available." >&2
  exit 1
fi

HAVE_GO=0
if command -v go >/dev/null 2>&1; then
  HAVE_GO=1
fi

echo "Tools: bun=$(command -v bun), node=$(command -v node), go=${HAVE_GO}
"

# Ensure dist dir exists
mkdir -p dist

# Build JS bundles with bun
echo "Building JS bundles with bun..."
bun build ./functions/cf-static-site-router-worker/index.ts --target=node --outdir ./dist/cf-static-site-router-worker/

bun build ./functions/cf-ssr-site-router-worker/index.ts --target=node --outdir ./dist/cf-ssr-site-router-worker/

bun build ./functions/nodejs-runtime/index.ts --target=node --outdir ./dist/nodejs-runtime/

bun build ./functions/nodejs-runtime/loop.ts --target=node --outdir ./dist/nodejs-runtime/

# Build bridge bootstrap (Go) or create placeholder if Go not available
if [ "$HAVE_GO" -eq 1 ]; then
  echo "Building bridge bootstrap (Go)..."
  env GOARCH=amd64 GOOS=linux go build -trimpath -buildvcs=false -mod=readonly -ldflags="-buildid=" -o ./dist/bridge/bootstrap ./functions/bridge
else
  echo "Go not found — creating placeholder bridge/bootstrap to satisfy embed." 
  mkdir -p dist/bridge
  cat > dist/bridge/bootstrap <<'BOOT'
#!/bin/sh
# placeholder bootstrap
exit 0
BOOT
  chmod +x dist/bridge/bootstrap || true
fi

# Run node build step
if [ -f ./scripts/build.mjs ]; then
  echo "Running node build.mjs..."
  node ./scripts/build.mjs
else
  echo "Note: scripts/build.mjs not found — skipping node build.mjs"
fi

# Copy additional runtime files expected by the embed
echo "Copying runtime files into dist/..."
mkdir -p ./dist/nodejs-bridge
if [ -f ./functions/nodejs-bridge/index.mjs ]; then
  cp ./functions/nodejs-bridge/index.mjs ./dist/nodejs-bridge/index.mjs
fi
if [ -f ./dist/bridge/bootstrap ]; then
  cp ./dist/bridge/bootstrap ./dist/nodejs-bridge/bootstrap || true
fi

mkdir -p ./dist/python-runtime/
if [ -f ./functions/python-runtime/index.py ]; then
  cp ./functions/python-runtime/index.py ./dist/python-runtime/index.py
fi

mkdir -p ./dist/dockerfiles/
if [ -f ./functions/docker/python.Dockerfile ]; then
  cp ./functions/docker/python.Dockerfile ./dist/dockerfiles/python.Dockerfile
fi

# Optional: build support/bridge-task if Go is available
if [ "$HAVE_GO" -eq 1 ]; then
  if [ -d ./support/bridge-task ]; then
    echo "Building support/bridge-task binaries (optional)..."
    pushd ./support/bridge-task >/dev/null
    mkdir -p build/amd64 build/arm64
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -mod=readonly -ldflags="-buildid=" -o build/amd64/main .
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -trimpath -mod=readonly -ldflags="-buildid=" -o build/arm64/main .
    popd >/dev/null
  fi
else
  echo "Skipping support/bridge-task builds (Go not available)"
fi

echo "Minimal platform build complete. Created/updated files under dist/"

exit 0
