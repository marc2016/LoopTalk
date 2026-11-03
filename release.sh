#!/usr/bin/env bash
# Release vorbereiten: prüfen, testen, Version setzen, committen, taggen, pushen.
# Das Image baut und veröffentlicht danach GitHub Actions (.github/workflows/ci.yml).
#
#   ./release.sh                     fragt nach patch, minor, major oder einer Version
#   ./release.sh patch|minor|major   nächste Version nach SemVer
#   ./release.sh 1.4.0               genau diese Version
#   ./release.sh … --skip-tests      ohne die Tests in Docker
set -euo pipefail
cd "$(dirname "$0")"

die() { echo "✖ $*" >&2; exit 1; }
step() { echo; echo "▶ $*"; }

TARGET=""
SKIP_TESTS=false
for arg in "$@"; do
  case "$arg" in
    --skip-tests) SKIP_TESTS=true ;;
    -h|--help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) die "Unbekannte Option: $arg" ;;
    *) [ -z "$TARGET" ] || die "Nur eine Version angeben."; TARGET="$arg" ;;
  esac
done

echo "LoopTalk Release"
echo "================"

# --- 1. Vorbedingungen ------------------------------------------------------
step "Prüfe Git-Stand …"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "main" ] || die "Releases nur von main (aktuell: $BRANCH)."
[ -z "$(git status --porcelain)" ] || die "Arbeitsbaum ist nicht sauber. Erst committen oder verwerfen."
git fetch --quiet --tags origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] ||
  die "main entspricht nicht origin/main. Erst pullen bzw. pushen."

CURRENT=$(node -p "require('./package.json').version")
echo "Aktuelle Version: v$CURRENT"

# --- 2. Zielversion ---------------------------------------------------------
if [ -z "$TARGET" ]; then
  echo
  echo "Welche Version?"
  echo "  1) patch  Fehlerbehebungen"
  echo "  2) minor  neue Funktionen"
  echo "  3) major  große oder inkompatible Änderungen"
  read -r -p "Auswahl [1-3 oder z. B. 1.4.0]: " CHOICE || CHOICE=""
  case "$CHOICE" in
    1) TARGET=patch ;;
    2) TARGET=minor ;;
    3) TARGET=major ;;
    *) TARGET="$CHOICE" ;;
  esac
fi

bump() {
  node -e '
    const [ma, mi, pa] = process.argv[1].split(".").map(Number);
    const next = { major: [ma + 1, 0, 0], minor: [ma, mi + 1, 0], patch: [ma, mi, pa + 1] }[process.argv[2]];
    console.log(next.join("."));
  ' "$CURRENT" "$1"
}
case "$TARGET" in
  patch|minor|major) TARGET=$(bump "$TARGET") ;;
esac
TARGET=${TARGET#v}

[[ "$TARGET" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] ||
  die "Ungültige Version „${TARGET}“, erwartet X.Y.Z."
node -e '
  const a = process.argv[1].split(".").map(Number), b = process.argv[2].split(".").map(Number);
  const cmp = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  process.exit(cmp > 0 ? 0 : 1);
' "$TARGET" "$CURRENT" || die "v$TARGET ist nicht größer als v$CURRENT."
! git rev-parse -q --verify "refs/tags/v$TARGET" >/dev/null || die "Tag v$TARGET existiert bereits."

echo "Neue Version: v$TARGET"

# --- 3. Tests ---------------------------------------------------------------
if [ "$SKIP_TESTS" = true ]; then
  step "Tests übersprungen (--skip-tests)."
else
  cleanup() { docker compose -f compose.test.yaml down -v --remove-orphans >/dev/null 2>&1 || true; }
  trap cleanup EXIT
  step "Lint, Typen, Unit-, Integrations- und API-Tests …"
  docker compose -f compose.test.yaml run --rm --build test
  step "Ende-zu-Ende-Tests …"
  docker compose -f compose.test.yaml run --rm --build e2e
  cleanup
  trap - EXIT
fi

# --- 4. Version setzen, committen, taggen -----------------------------------
step "Setze Version v$TARGET …"
FILES=(package.json apps/server/package.json apps/web/package.json packages/shared/package.json e2e/package.json package-lock.json)
npm version "$TARGET" --workspaces --include-workspace-root --no-workspaces-update --no-git-tag-version >/dev/null
npm install --package-lock-only --ignore-scripts --no-audit --no-fund >/dev/null

UNEXPECTED=$(git status --porcelain | awk '{print $2}' | grep -vxF -f <(printf '%s\n' "${FILES[@]}") || true)
[ -z "$UNEXPECTED" ] || die "Unerwartet geänderte Dateien, bitte prüfen:
$UNEXPECTED"

git add -- "${FILES[@]}"
git commit --quiet -m "Release v$TARGET"
git tag -a "v$TARGET" -m "Release v$TARGET"
echo "✔ Commit und Tag v$TARGET erstellt."

# --- 5. Pushen --------------------------------------------------------------
echo
read -r -p "main und v$TARGET nach GitHub pushen? Danach baut GitHub Actions das Image. (y/N): " CONFIRM || CONFIRM=""
if [[ "$CONFIRM" =~ ^[YyJj]$ ]]; then
  git push --quiet origin main
  git push --quiet origin "v$TARGET"
  echo "✔ v$TARGET gepusht. Fortschritt: https://github.com/marc2016/LoopTalk/actions"
else
  echo "Commit und Tag bleiben lokal. Später pushen mit:"
  echo "  git push origin main && git push origin v$TARGET"
fi
