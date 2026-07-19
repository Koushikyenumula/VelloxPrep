$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:5500/')
$listener.Start()
Write-Host 'Server running on http://localhost:5500/'

$basePath = 'c:\OneDrive\Desktop\Ai-Interview Prep\frontend'

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $resp = $ctx.Response
    $path = $req.Url.LocalPath

    if ($path -eq '/') { $path = '/pages/login.html' }

    $filePath = Join-Path $basePath ($path.TrimStart('/').Replace('/', '\'))

    Write-Host "Request: $path -> $filePath"

    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()

        $mime = switch ($ext) {
            '.html' { 'text/html; charset=utf-8' }
            '.css'  { 'text/css; charset=utf-8' }
            '.js'   { 'application/javascript; charset=utf-8' }
            '.png'  { 'image/png' }
            '.jpg'  { 'image/jpeg' }
            '.svg'  { 'image/svg+xml' }
            '.ico'  { 'image/x-icon' }
            '.woff2' { 'font/woff2' }
            default { 'application/octet-stream' }
        }

        $resp.ContentType = $mime
        $resp.ContentLength64 = $content.Length
        $resp.OutputStream.Write($content, 0, $content.Length)
    } else {
        $resp.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    }

    $resp.Close()
}
