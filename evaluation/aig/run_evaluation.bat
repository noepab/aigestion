@echo off
echo 🔍 Running AIG Evaluation with GitHub Models
echo.
cd /d "%~dp0"
call venv\Scripts\activate.bat
python evaluate_gemini_github.py
pause
