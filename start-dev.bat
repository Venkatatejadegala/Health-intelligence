@echo off
echo 🏥 Health Hub - Starting Development Environment
echo ===============================================

echo.
echo 🚀 Starting services...

echo.
echo 📡 Starting Backend API...
start "Backend API" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo 🤖 Starting ML Microservice...
start "ML Service" cmd /k "cd ml-microservice && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo 🎨 Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ All services are starting up!
echo.
echo 📱 Access your application at:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:5000
echo    ML Service: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 🔑 Demo Credentials:
echo    Email: demo@health.com
echo    Password: password123
echo.
echo ⏹️  To stop all services, close the command windows
echo.
pause
