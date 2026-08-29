#!/usr/bin/env bash

_workstream_completions() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local prev="${COMP_WORDS[COMP_CWORD-1]}"
  local commands="list find add remove setup"

  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    return
  fi

  case "$prev" in
    find|remove)
      local names=$(workstream --completion-names 2>/dev/null)
      COMPREPLY=($(compgen -W "$names" -- "$cur"))
      ;;
    add)
      case "$cur" in
        --*) COMPREPLY=($(compgen -W "--path --context --desc" -- "$cur")) ;;
      esac
      ;;
    list)
      COMPREPLY=($(compgen -W "--names --full --match --json" -- "$cur"))
      ;;
  esac
}

complete -F _workstream_completions workstream
