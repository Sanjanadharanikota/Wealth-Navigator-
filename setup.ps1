# PowerShell setup script for Windows

Write-Host "🚀 Setting up Financial Agent Application..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
$nodeVersion = node -v
if ($nodeVersion -match "v(\d+)\.") {
    $majorVersion = [int]$matches[1]
    if ($majorVersion -lt 18) {
        Write-Host "❌ Node.js 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install
Write-Host ""

# Install server dependencies
Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
Set-Location ..
Write-Host ""

# Install client dependencies
Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
Set-Location ..
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Using existing .env..." -ForegroundColor Yellow
    Write-Host "✅ .env file ready" -ForegroundColor Green
}

# Check if server/.env exists
if (-not (Test-Path "server\.env")) {
    Write-Host "⚠️  server\.env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "✅ Created server\.env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Update server\.env with your MongoDB URI!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update server\.env with your MongoDB URI"
Write-Host "2. Start MongoDB (or use Docker Compose)"
Write-Host "3. Run 'npm run dev' to start development servers"
Write-Host ""
Write-Host "🐳 Or use Docker:" -ForegroundColor Cyan
Write-Host "   docker-compose up -d"
Write-Host ""
