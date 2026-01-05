"""
Response Collection Script for AIGestion Gemini API

This script collects responses from the AIGestion Gemini API endpoint for the test dataset queries.

Usage:
    python collect_responses.py
"""

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List

import requests
from dotenv import load_dotenv

load_dotenv()

DEFAULT_API_URL = os.environ.get("AIGESTION_API_URL", "http://localhost:3000")
GENERATE_ENDPOINT = "/api/ai/generate"


def collect_response(query: str, context: str, api_url: str) -> Dict[str, Any]:
    """Collect a single response from the AIGestion Gemini API."""
    url = f"{api_url}{GENERATE_ENDPOINT}"
    prompt = f"{context}\n\n{query}" if context else query
    payload = {"prompt": prompt}

    start_time = time.time()

    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
        latency = time.time() - start_time
        response.raise_for_status()

        data = response.json()
        text = data.get("text", "")

        return {
            "query": query,
            "context": context,
            "response": text,
            "latency": round(latency, 3),
            "status": "success"
        }

    except requests.RequestException as e:
        latency = time.time() - start_time
        return {
            "query": query,
            "context": context,
            "response": "",
            "latency": round(latency, 3),
            "status": "error",
            "error": str(e)
        }


def collect_all_responses(input_path: Path, output_path: Path, api_url: str) -> List[Dict[str, Any]]:
    """Collect responses for all queries in the input dataset."""
    print(f"Reading queries from: {input_path}")

    queries = []
    with open(input_path, 'r', encoding='utf-8') as f:
        for line in f:
            queries.append(json.loads(line))

    print(f"Found {len(queries)} queries to process")
    print(f"Using API endpoint: {api_url}{GENERATE_ENDPOINT}\n")

    results = []

    for i, query_data in enumerate(queries, 1):
        query = query_data.get("query", "")
        context = query_data.get("context", "")

        print(f"[{i}/{len(queries)}] Processing: {query[:60]}...")

        result = collect_response(query, context, api_url)
        results.append(result)

        if result["status"] == "success":
            print(f"  Success (latency: {result['latency']}s)")
        else:
            print(f"  Error: {result.get('error', 'Unknown error')}")

        if i < len(queries):
            time.sleep(0.5)

    print(f"\nSaving responses to: {output_path}")

    with open(output_path, 'w', encoding='utf-8') as f:
        for result in results:
            f.write(json.dumps(result, ensure_ascii=False) + '\n')

    successful = sum(1 for r in results if r["status"] == "success")
    failed = len(results) - successful
    avg_latency = sum(r["latency"] for r in results if r["status"] == "success") / max(successful, 1)

    print("\n" + "="*60)
    print("COLLECTION SUMMARY")
    print("="*60)
    print(f"Total queries: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Average latency: {avg_latency:.3f}s")
    print("="*60)

    return results


def main():
    parser = argparse.ArgumentParser(description="Collect responses from AIGestion Gemini API")

    parser.add_argument("--input", type=Path, default=Path("test_dataset.jsonl"))
    parser.add_argument("--output", type=Path, default=Path("test_dataset_with_responses.jsonl"))
    parser.add_argument("--api-url", type=str, default=DEFAULT_API_URL)

    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}")
        return 1

    try:
        health_url = f"{args.api_url}/health"
        response = requests.get(health_url, timeout=5)
        response.raise_for_status()
        print(f"API health check passed: {health_url}\n")
    except requests.RequestException as e:
        print(f"Warning: Could not reach API at {args.api_url}")
        print(f"Error: {e}")
        print("Make sure the AIGestion server is running\n")

        user_input = input("Continue anyway? (y/N): ")
        if user_input.lower() != 'y':
            return 1

    try:
        collect_all_responses(args.input, args.output, args.api_url)
        print("\nResponse collection completed!")
        print(f"Next step: Run 'python evaluate_gemini.py --data {args.output}'")

    except Exception as e:
        print(f"\nError: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
