# PowerShell script to configure environment variables

Write-Host "🔧 Configuring Environment Variables..." -ForegroundColor Cyan
Write-Host ""

$serverEnvContent = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - MongoDB Atlas
MONGODB_URI=your_mongodb_connection_string_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption
AES_256_KEY=your_aes_256_key_here_32_bytes_64_hex_characters

# Plaid Configuration (Sandbox)
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_secret_here
PLAID_ENV=sandbox

# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# WebAuthn
RP_NAME=Financial Agent
RP_ID=localhost
ORIGIN=http://localhost:3000

# CORS
ALLOWED_ORIGINS=http://localhost:3000","http://localhost:5173
"@

# Create server/.env file
$serverEnvContent | Out-File -FilePath server/.env -Encoding UTF8 -NoNewline

Write-Host "✓ Created server/.env" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run install:all" -ForegroundColor Yellow
Write-Host "2. Run: npm run dev" -ForegroundColor Yellow
Write-Host ""
