$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ExcludeDirs = @("node_modules", ".next", ".git", ".vercel", "dist", "out")

$Patterns = @(
    @{ Name = "Private Key Block"; Regex = "-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----" },
    @{ Name = "GCP Service Account JSON"; Regex = '"type"\s*:\s*"service_account"' },
    @{ Name = "Google API Key"; Regex = "AIza[0-9A-Za-z\-_]{35}" },
    @{ Name = "GitHub PAT"; Regex = "ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{80,}" },
    @{ Name = "AWS Access Key"; Regex = "AKIA[0-9A-Z]{16}" },
    @{ Name = "Vercel Token"; Regex = "vercel_[0-9A-Za-z]{20,}" }
)

$ForbiddenFiles = @(".env", ".env.local", "terraform.tfstate", "credentials.json")

$Findings = @()

Get-ChildItem -Path $RepoRoot -Recurse -File -Force | ForEach-Object {
    $RelPath = $_.FullName.Substring($RepoRoot.Path.Length + 1)
    $Segments = $RelPath -split "[\\/]"
    foreach ($ex in $ExcludeDirs) {
        if ($Segments -contains $ex) { return }
    }

    if ($ForbiddenFiles -contains $_.Name -or $_.Name -like "*service-account*.json" -or $_.Name -like "*.tfstate*") {
        $Findings += "FORBIDDEN FILE: $RelPath"
    }

    if ($_.Name -eq "secret-scan.ps1") { return }

    if ($_.Extension -in @(".md", ".mmd", ".ts", ".tsx", ".js", ".mjs", ".json", ".yml", ".yaml", ".ps1", ".css", ".txt")) {
        $Content = [System.IO.File]::ReadAllText($_.FullName)
        if ([string]::IsNullOrEmpty($Content)) { return }
        foreach ($p in $Patterns) {
            if ($Content -match $p.Regex) {
                $Findings += "SECRET MATCH [$($p.Name)]: $RelPath"
            }
        }
    }
}

if ($Findings.Count -gt 0) {
    Write-Host "SECRET SCAN FAILED ($($Findings.Count) findings):" -ForegroundColor Red
    $Findings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "SECRET SCAN PASSED: 0 findings across working tree." -ForegroundColor Green
exit 0
