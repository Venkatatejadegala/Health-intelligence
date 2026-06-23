# Health Hub - Development Startup Script for Windows PowerShell
# This script starts all services for development

Write-Host "🏥 Health Hub - Starting Development Environment" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if ports are available
$ports = @(3000, 5000, 5173, 8000)
foreach ($port in $ports) {
    if (Test-Port $port) {
        Write-Host "⚠️  Port $port is already in use. Please stop the service using this port." -ForegroundColor Yellow
    }
}

Write-Host "`n🚀 Starting services..." -ForegroundColor Green

# Start Backend
Write-Host "`n📡 Starting Backend API..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start ML Service
Write-Host "🤖 Starting ML Microservice..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-microservice; python -m uvicorn main:app --reload --port 8000" -WindowStyle Normal

# Wait a moment for ML service to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "`n✅ All services are starting up!" -ForegroundColor Green
Write-Host "`n📱 Access your application at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "   ML Service: http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n🔑 Demo Credentials:" -ForegroundColor Yellow
Write-Host "   Email: demo@health.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White

Write-Host "`n⏹️  To stop all services, close the PowerShell windows or press Ctrl+C" -ForegroundColor Red
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
