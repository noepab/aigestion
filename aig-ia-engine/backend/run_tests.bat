@echo off
REM AIG IA Engine - Run Tests Script
REM This script activates the server venv and runs tests

REM Resolve repo root relative to this script (assumes git available)
for /f "usebackq delims=" %%i in (`git -C "%~dp0" rev-parse --show-toplevel 2^>nul`) do set REPO_ROOT=%%i
if "%REPO_ROOT%"=="" (
	pushd "%~dp0..\..\"
	set REPO_ROOT=%CD%
	popd
)

REM Set Python path
set PYTHONPATH=%REPO_ROOT%\aig-ia-engine\backend

REM Run tests using server venv pytest
echo Running AIG IA Engine Tests...
echo ==============================
"%REPO_ROOT%\server\.venv\Scripts\pytest.exe" tests\ -v %*

echo.
echo Test run complete!
