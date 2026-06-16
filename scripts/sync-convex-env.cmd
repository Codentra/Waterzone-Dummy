@echo off
setlocal
cd /d "%~dp0.."

if not exist "backend\.env.local" (
  echo ERROR: backend\.env.local not found in %CD%
  exit /b 1
)

echo Syncing Convex URL...
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "CONVEX_URL=" backend\.env.local`) do (
  set "CONVEX_URL=%%b"
)

if not defined CONVEX_URL (
  echo ERROR: backend\.env.local missing CONVEX_URL
  exit /b 1
)

echo NEXT_PUBLIC_CONVEX_URL=%CONVEX_URL%> admin-dashboard\.env.local
echo EXPO_PUBLIC_CONVEX_URL=%CONVEX_URL%> mobile-app\.env

echo.
echo Linked to Convex: %CONVEX_URL%
echo   admin-dashboard\.env.local
echo   mobile-app\.env
echo.
endlocal
