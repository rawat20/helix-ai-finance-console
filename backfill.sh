#!/bin/bash
set -euo pipefail

# Replace with the email verified on your GitHub account so contributions count.
git config user.email "rawataditya2000@gmail.com"

for month in 01 02; do
  if [ "$month" = "01" ]; then
    max_day=31
  else
    max_day=28
  fi

  for d in $(seq 1 "$max_day"); do
    day=$(printf '%02d' "$d")
    DATE="2026-${month}-${day}T12:00:00"

    # Skip ~30% of days randomly (simulates days off)
    if [ $((RANDOM % 10)) -lt 3 ]; then
      continue
    fi

    num_commits=$((RANDOM % 5 + 1))

    for i in $(seq 1 "$num_commits"); do
      echo "[$DATE] session $i" >> activity.log
      git add -f activity.log
      GIT_AUTHOR_DATE="$DATE" \
      GIT_COMMITTER_DATE="$DATE" \
      git commit -m "chore: update log"
    done
  done
done

# Pushes whatever branch you are on (e.g. helix/v2/test for safe testing).
git push -u origin HEAD
