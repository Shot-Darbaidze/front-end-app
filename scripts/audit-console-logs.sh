#!/bin/bash

# Script to identify console.log statements that should use secure logger
# Usage: ./scripts/audit-console-logs.sh

echo "🔍 Auditing console statements in application code..."
echo ""

# Search for console statements (excluding tests and node_modules)
grep -rn "console\." src/ \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir="__tests__" \
  --exclude-dir="node_modules" \
  | grep -v "secureLogger.ts" \
  | grep -v "api.ts.*Cache" \
  > /tmp/console-audit.txt

if [ -s /tmp/console-audit.txt ]; then
  echo "⚠️  Found console statements that should be reviewed:"
  echo ""
  cat /tmp/console-audit.txt
  echo ""
  echo "📊 Total: $(wc -l < /tmp/console-audit.txt) occurrences"
  echo ""
  echo "💡 Recommendations:"
  echo "   1. Replace console.log with logger.info() or logger.debug()"
  echo "   2. Replace console.error with logger.error()"
  echo "   3. Replace console.warn with logger.warn()"
  echo "   4. Import from: import { logger } from '@/utils/secureLogger'"
else
  echo "✅ No console statements found in application code!"
fi

rm -f /tmp/console-audit.txt
