param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [string]$Output = "index.offline.html"
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path -LiteralPath $Root).Path
$outputPath = Join-Path $rootPath $Output

function Read-Utf8([string]$relativePath) {
  $path = Join-Path $rootPath $relativePath
  if (!(Test-Path -LiteralPath $path)) { throw "Missing bundle input: $relativePath" }
  return [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
}

function Data-Uri([string]$relativePath) {
  $path = Join-Path $rootPath $relativePath
  if (!(Test-Path -LiteralPath $path)) { throw "Missing asset: $relativePath" }
  $bytes = [IO.File]::ReadAllBytes($path)
  $mime = switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".jpg" { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".png" { "image/png" }
    ".webp" { "image/webp" }
    ".gif" { "image/gif" }
    default { "application/octet-stream" }
  }
  return "data:$mime;base64," + [Convert]::ToBase64String($bytes)
}

$html = Read-Utf8 "index.html"
$css = Read-Utf8 "styles.css"
$scriptFiles = @(
  "gemini-code-1788430656294.js",
  "data/world_data.js",
  "data/fate_data.js",
  "data/fate_relationships.js",
  "data/cong_phap.js",
  "data/npc_monsters.js",
  "data/path_fate_relations.js",
  "data/profession_items.js",
  "data/expansion_data.js",
  "data/data.js",
  "js/i18n.js",
  "js/engine.js",
  "js/expansion.js",
  "js/ui.js",
  "js/main.js"
)

$newline = [Environment]::NewLine
$inlineCss = "<style>" + $newline + $css + $newline + "</style>"
$html = [regex]::Replace($html, '<link\s+rel="stylesheet"\s+href="styles\.css"\s*/?>', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $inlineCss }, 1)

foreach ($relativePath in $scriptFiles) {
  $escaped = [regex]::Escape($relativePath)
  $script = '<script[^>]+src="' + $escaped + '"[^>]*></script>'
  $inline = "<script>" + $newline + (Read-Utf8 $relativePath) + $newline + "</script>"
  $html = [regex]::Replace($html, $script, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $inline }, 1)
}

$assetFiles = Get-ChildItem (Join-Path $rootPath "assets") -Recurse -File
foreach ($asset in $assetFiles) {
  $relativePath = $asset.FullName.Substring($rootPath.Length + 1).Replace("\", "/")
  $uri = Data-Uri $relativePath
  $html = $html.Replace($relativePath, $uri)
}

[IO.File]::WriteAllText($outputPath, $html, [Text.UTF8Encoding]::new($false))
Write-Output ("Built offline bundle: " + $outputPath)
