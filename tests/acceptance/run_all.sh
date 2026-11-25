#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ">>> Execution du lot 1..."
bash "$DIR/lot1.sh"

echo ">>> Execution du lot 2..."
bash "$DIR/lot2.sh"

echo "=== TOUS LES LOTS D'ACCEPTANCE ONT REUSSI ==="
