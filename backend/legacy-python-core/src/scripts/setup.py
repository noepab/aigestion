# AIGestion Source Package - Python Setup
from setuptools import find_packages, setup

setup(
    name="aigestion",
    version="2.0.0",
    description="AI Agent System",
    author="AIGestion Team",
    author_email="soporte@aigestion.net",
    packages=find_packages(),
    python_requires=">=3.10",
    install_requires=[
        "python-dotenv>=1.0.0",
        "aiofiles>=23.0.0",
        "requests>=2.31.0",
        "flask>=3.0.0",
        "numpy>=1.24.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "ruff>=0.1.0",
        ],
        "ml": [
            "sentence-transformers>=2.2.0",
        ],
        "agent": [
            "agent-framework>=0.1.0",
            "openai>=1.0.0",
        ],
        "otel": [
            "opentelemetry-api>=1.20.0",
            "opentelemetry-sdk>=1.20.0",
            "opentelemetry-exporter-otlp>=1.20.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "aigestion-agent=src.agent.core:main",
            "aigestion-help-bot=src.help.bot:run",
            "aigestion-help-web=src.help.web:run",
            "aigestion-retrain=src.training.retrain:generate_dataset",
            "aigestion-evaluate=src.training.evaluation:run_auto_evaluation",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
