# PowerShell script to start the Financial Agent application

Write-Host "🚀 Starting Financial Agent Application..." -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB connection is configured
Write-Host "📋 Checking configuration..." -ForegroundColor Yellow

$serverEnvPath = ".\server\.env"
if (-not (Test-Path $serverEnvPath)) {
    Write-Host "❌ Server .env file not found!" -ForegroundColor Red
    Write-Host "Run: .\configure-env.ps1 first" -ForegroundColor Yellow
    exit 1
}

$clientEnvPath = ".\client\.env"
if (-not (Test-Path $clientEnvPath)) {
    Write-Host "❌ Client .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration files found" -ForegroundColor Green
Write-Host ""

# Warning about MongoDB
Write-Host "⚠️  IMPORTANT: MongoDB Atlas Connection" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Before starting, ensure your IP is whitelisted in MongoDB Atlas:" -ForegroundColor White
Write-Host "1. Go to: https://cloud.mongodb.com/" -ForegroundColor Cyan
Write-Host "2. Navigate to: Network Access" -ForegroundColor Cyan
Write-Host "3. Click: Add IP Address → Add Current IP Address" -ForegroundColor Cyan
Write-Host "4. Wait 1-2 minutes for changes to apply" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue once IP is whitelisted..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Start backend
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; Write-Host '🚀 Backend Server' -ForegroundColor Green; npm run dev"

Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; Write-Host '🎨 Frontend Server' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "✅ Application Starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Servers:" -ForegroundColor Cyan
Write-Host "  • Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📖 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Wait for both servers to start (check the new windows)" -ForegroundColor White
Write-Host "  2. Open: http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  3. Follow: TESTING_GUIDE.md for testing instructions" -ForegroundColor White
Write-Host ""
Write-Host "🐛 Troubleshooting:" -ForegroundColor Yellow
Write-Host "  • If backend hangs: Check MongoDB Atlas IP whitelist" -ForegroundColor White
Write-Host "  • If frontend fails: Check for port 5173 conflicts" -ForegroundColor White
Write-Host "  • See: TESTING_GUIDE.md for detailed help" -ForegroundColor White
Write-Host ""
