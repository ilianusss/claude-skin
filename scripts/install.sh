#!/usr/bin/env bash
# Installs the skin plugin into one or more Claude Code config dirs.
#
#   scripts/install.sh                          ~/.claude, from GitHub
#   scripts/install.sh --config-dir ~/.claude-team --config-dir ~/.claude
#   scripts/install.sh --prometheus [THEME_HOME]   also .theme mode: SKIN_THEME_HOME in settings.json env
#   scripts/install.sh --local                  from this checkout instead of GitHub
#
# .theme mode only needs `"env": { "SKIN_THEME_HOME": "~/.theme" }` in a settings.json; a config
# repo that owns settings.json can carry that line itself instead of using --prometheus.
set -euo pipefail

source_ref="ilianusss/claude-skin"
theme_home=""
dirs=()

while (($#)); do
    case $1 in
        --prometheus)
            theme_home="~/.theme"
            if [[ ${2-} != "" && ${2-} != --* ]]; then theme_home=$2; shift; fi
            ;;
        --config-dir) dirs+=("${2:?--config-dir needs a folder}"); shift ;;
        --local) source_ref=$(cd "$(dirname "$0")/.." && pwd) ;;
        -h | --help) sed -n '2,10s/^# \{0,1\}//p' "$0"; exit 0 ;;
        *) echo "install.sh: unknown argument $1" >&2; exit 2 ;;
    esac
    shift
done
((${#dirs[@]})) || dirs=("$HOME/.claude")
command -v claude >/dev/null || { echo "install.sh: claude is not on PATH" >&2; exit 1; }

for dir in "${dirs[@]}"; do
    dir=${dir/#\~/$HOME}
    echo "== $dir"
    # The default dir runs without CLAUDE_CONFIG_DIR: set, Claude Code looks for its global
    # config inside the dir instead of ~/.claude.json.
    env=()
    [[ $dir == "$HOME/.claude" ]] || env=("CLAUDE_CONFIG_DIR=$dir")
    # Adding a marketplace that is already there fails harmlessly; the install below still runs.
    env "${env[@]}" claude plugin marketplace add "$source_ref" || true
    env "${env[@]}" claude plugin install skin@ilianusss

    if [[ -n $theme_home ]]; then
        python3 -I - "$dir/settings.json" "$theme_home" <<'PY'
import json, os, sys
path, home = sys.argv[1], sys.argv[2]
settings = json.load(open(path)) if os.path.exists(path) else {}
settings.setdefault("env", {})["SKIN_THEME_HOME"] = home
with open(path, "w") as f:
    json.dump(settings, f, indent=2)
    f.write("\n")
print(f"{path}: env.SKIN_THEME_HOME = {home}")
PY
    fi
done
echo "Restart Claude Code; /skin opens the settings."
