Register-ArgumentCompleter -Native -CommandName 'workstream' -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    $commands = @('list', 'find', 'add', 'remove', 'setup')
    $completions = @()

    $words = $commandAst.CommandElements
    if ($words.Count -le 1) {
        $completions = $commands | Where-Object { $_ -like "$wordToComplete*" }
    } else {
        $subcommand = $words[1].Value
        switch ($subcommand) {
            'find' { $completions = & workstream --completion-names 2>$null | Where-Object { $_ -like "$wordToComplete*" } }
            'remove' { $completions = & workstream --completion-names 2>$null | Where-Object { $_ -like "$wordToComplete*" } }
            'add' { $completions = @('--path', '--context', '--desc') | Where-Object { $_ -like "$wordToComplete*" } }
            'list' { $completions = @('--names', '--full', '--match', '--json') | Where-Object { $_ -like "$wordToComplete*" } }
        }
    }

    $completions | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}
