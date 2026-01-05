"""
AIG Gemini API Evaluation Script

This script evaluates the quality of responses from AIGestion's Gemini API integration
using Azure AI Evaluation SDK with built-in evaluators:
- CoherenceEvaluator: Measures text coherence and readability
- FluencyEvaluator: Assesses grammatical correctness and naturalness
- RelevanceEvaluator: Evaluates response relevance to the query

Prerequisites:
1. Install dependencies: pip install -r requirements.txt
2. Set up environment variables in .env file (see .env.example)
3. Collect responses from AIGestion Gemini API (use collect_responses.py)

Usage:
    python evaluate_gemini.py --data test_dataset_with_responses.jsonl --output results/

Environment Variables:
    AZURE_OPENAI_ENDPOINT: Azure OpenAI endpoint for LLM-as-judge evaluators
    AZURE_OPENAI_KEY: Azure OpenAI API key
    AZURE_OPENAI_DEPLOYMENT: Model deployment name (e.g., gpt-4)
"""

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict

from azure.ai.evaluation import CoherenceEvaluator, FluencyEvaluator, RelevanceEvaluator, evaluate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def validate_environment() -> Dict[str, str]:
    """
    Validate that all required environment variables are set.

    Returns:
        dict: Model configuration for Azure OpenAI

    Raises:
        ValueError: If required environment variables are missing
    """
    required_vars = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_KEY",
        "AZURE_OPENAI_DEPLOYMENT"
    ]

    missing_vars = [var for var in required_vars if not os.environ.get(var)]

    if missing_vars:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing_vars)}\n"
            f"Please set them in your .env file (see .env.example)"
        )

    return {
        "azure_endpoint": os.environ["AZURE_OPENAI_ENDPOINT"],
        "api_key": os.environ["AZURE_OPENAI_KEY"],
        "azure_deployment": os.environ["AZURE_OPENAI_DEPLOYMENT"]
    }


def validate_dataset(data_path: Path) -> None:
    """
    Validate that the dataset file exists and has the correct format.

    Args:
        data_path: Path to the JSONL dataset file

    Raises:
        FileNotFoundError: If the dataset file doesn't exist
        ValueError: If the dataset format is invalid
    """
    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {data_path}\n"
            f"Please run collect_responses.py first to generate responses."
        )

    # Validate JSONL format and required fields
    required_fields = ["query", "response"]

    with open(data_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                missing_fields = [field for field in required_fields if field not in data]

                if missing_fields:
                    raise ValueError(
                        f"Line {i}: Missing required fields: {', '.join(missing_fields)}\n"
                        f"Required fields: {', '.join(required_fields)}"
                    )

                # Check for empty responses
                if not data.get("response") or not data.get("response").strip():
                    print(f"Warning: Line {i} has an empty response")

            except json.JSONDecodeError as e:
                raise ValueError(f"Line {i}: Invalid JSON format: {e}")


def run_evaluation(data_path: Path, output_dir: Path) -> Dict[str, Any]:
    """
    Run evaluation on the AIGestion Gemini API responses.

    Args:
        data_path: Path to the JSONL dataset with responses
        output_dir: Directory to save evaluation results

    Returns:
        dict: Evaluation results including metrics and row-level data
    """
    print("🔧 Configuring evaluators...")

    # Validate environment and get model config
    model_config = validate_environment()

    # Initialize evaluators
    coherence_evaluator = CoherenceEvaluator(model_config=model_config)
    fluency_evaluator = FluencyEvaluator(model_config=model_config)
    relevance_evaluator = RelevanceEvaluator(model_config=model_config)

    print("✅ Evaluators initialized:")
    print("  - CoherenceEvaluator (measures text coherence and readability)")
    print("  - FluencyEvaluator (assesses grammatical correctness)")
    print("  - RelevanceEvaluator (evaluates response relevance)")

    print(f"\n📊 Running evaluation on: {data_path}")
    print(f"📁 Output directory: {output_dir}")

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "evaluation_results.json"

    # Run evaluation using the evaluate() API
    result = evaluate(
        data=str(data_path),
        evaluators={
            "coherence": coherence_evaluator,
            "fluency": fluency_evaluator,
            "relevance": relevance_evaluator
        },
        evaluator_config={
            "coherence": {
                "column_mapping": {
                    "query": "${data.query}",
                    "response": "${data.response}"
                }
            },
            "fluency": {
                "column_mapping": {
                    "response": "${data.response}"
                }
            },
            "relevance": {
                "column_mapping": {
                    "query": "${data.query}",
                    "response": "${data.response}"
                }
            }
        },
        output_path=str(output_path)
    )

    print("\n✅ Evaluation completed!")
    print(f"📄 Results saved to: {output_path}")

    # Print summary metrics
    print("\n" + "="*60)
    print("EVALUATION SUMMARY")
    print("="*60)

    metrics = result.get("metrics", {})

    for metric_name, metric_value in metrics.items():
        if isinstance(metric_value, (int, float)):
            print(f"{metric_name}: {metric_value:.4f}")

    print("="*60)

    return result


def main():
    """Main entry point for the evaluation script."""
    parser = argparse.ArgumentParser(
        description="Evaluate AIGestion Gemini API responses using Azure AI Evaluation SDK",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run evaluation on collected responses
  python evaluate_gemini.py --data test_dataset_with_responses.jsonl

  # Specify custom output directory
  python evaluate_gemini.py --data test_dataset_with_responses.jsonl --output results/exp1/

For more information, see README.md
        """,
    )

    parser.add_argument(
        "--data",
        type=Path,
        default=Path("test_dataset_with_responses.jsonl"),
        help="Path to JSONL file with queries and responses (default: test_dataset_with_responses.jsonl)"
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=Path("results"),
        help="Output directory for evaluation results (default: results/)"
    )

    args = parser.parse_args()

    try:
        # Validate dataset
        validate_dataset(args.data)

        # Run evaluation
        result = run_evaluation(args.data, args.output)

        print("\n🎉 Evaluation completed successfully!")
        print(f"   Check {args.output / 'evaluation_results.json'} for detailed results.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
