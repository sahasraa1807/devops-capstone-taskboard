#!/usr/bin/env bash
# ==========================================
# TaskBoard HPA Shell Load Generator
# ==========================================

TARGET_URL="${1:-http://taskboard.local/api/tasks/stats}"
CONCURRENCY="${2:-15}"
DURATION="${3:-60}"

echo "============================================="
echo " TaskBoard HPA Load Generation Tool"
echo " Target URL:   $TARGET_URL"
echo " Concurrency:  $CONCURRENCY background loops"
echo " Duration:     $DURATION seconds"
echo "============================================="
echo "Monitor HPA scaling in another terminal:"
echo "  kubectl get hpa -n taskboard -w"
echo "  kubectl get pods -n taskboard -w"
echo "============================================="

END=$((SECONDS + DURATION))

for i in $(seq 1 "$CONCURRENCY"); do
  (
    while [ $SECONDS -lt $END ]; do
      curl -s -o /dev/null -w "%{http_code}\n" "$TARGET_URL" > /dev/null
    done
  ) &
done

wait
echo ""
echo "✅ Load test completed."
