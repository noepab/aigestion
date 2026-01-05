"""
Evaluation script for AIGestion Gemini API using GitHub Models (free alternative to Azure OpenAI)
Uses GitHub's free GPT-4 access for LLM-as-Judge evaluation
"""

import json
import os
import time
from typing import Dict

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_MODEL = os.getenv("GITHUB_MODEL", "gpt-4o")  # or gpt-4o-mini for faster/cheaper
AIGESTION_API_URL = os.getenv("AIGESTION_API_URL", "http://localhost:3000")


def evaluate_coherence(query: str, response: str, context: str = "") -> Dict:
    """Evaluate response coherence using GitHub Models GPT-4"""

    prompt = f"""You are an AI evaluator. Rate the coherence of the following response on a scale of 1-5.

Coherence measures:
- Logical consistency and flow
- Internal contradictions (should be none)
- Natural progression of ideas
- Overall readability

Query: {query}
Context: {context}
Response: {response}

Provide:
1. A score from 1 (incoherent) to 5 (perfectly coherent)
2. A brief explanation

Format your response as JSON:
{{"score": <1-5>, "reasoning": "<explanation>"}}
"""

    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Content-Type": "application/json"}

    payload = {
        "model": GITHUB_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 500,
    }

    try:
        response = requests.post(
            "https://models.inference.ai.azure.com/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        # Parse JSON response
        eval_result = json.loads(content.strip().strip("```json").strip("```"))
        return eval_result

    except Exception as e:
        print(f"⚠️ Coherence evaluation failed: {e}")
        return {"score": 0, "reasoning": f"Evaluation error: {str(e)}"}


def evaluate_fluency(query: str, response: str) -> Dict:
    """Evaluate response fluency using GitHub Models GPT-4"""

    prompt = f"""You are an AI evaluator. Rate the fluency of the following response on a scale of 1-5.

Fluency measures:
- Grammar and syntax correctness
- Natural language flow
- Proper word choice
- Professional writing quality

Query: {query}
Response: {response}

Provide:
1. A score from 1 (poor fluency) to 5 (excellent fluency)
2. A brief explanation

Format your response as JSON:
{{"score": <1-5>, "reasoning": "<explanation>"}}
"""

    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Content-Type": "application/json"}

    payload = {
        "model": GITHUB_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 500,
    }

    try:
        response = requests.post(
            "https://models.inference.ai.azure.com/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        eval_result = json.loads(content.strip().strip("```json").strip("```"))
        return eval_result

    except Exception as e:
        print(f"⚠️ Fluency evaluation failed: {e}")
        return {"score": 0, "reasoning": f"Evaluation error: {str(e)}"}


def evaluate_relevance(query: str, response: str, context: str = "") -> Dict:
    """Evaluate response relevance using GitHub Models GPT-4"""

    prompt = f"""You are an AI evaluator. Rate the relevance of the following response on a scale of 1-5.

Relevance measures:
- How well the response addresses the query
- Appropriate use of provided context
- Focus on the question asked
- Absence of off-topic information

Query: {query}
Context: {context}
Response: {response}

Provide:
1. A score from 1 (not relevant) to 5 (highly relevant)
2. A brief explanation

Format your response as JSON:
{{"score": <1-5>, "reasoning": "<explanation>"}}
"""

    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Content-Type": "application/json"}

    payload = {
        "model": GITHUB_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 500,
    }

    try:
        response = requests.post(
            "https://models.inference.ai.azure.com/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        eval_result = json.loads(content.strip().strip("```json").strip("```"))
        return eval_result

    except Exception as e:
        print(f"⚠️ Relevance evaluation failed: {e}")
        return {"score": 0, "reasoning": f"Evaluation error: {str(e)}"}


def run_evaluation(
    input_file: str = "test_dataset_with_responses.jsonl", output_dir: str = "results"
):
    """Run complete evaluation on collected responses"""

    print("🔍 AIGestion Gemini Evaluation (GitHub Models)")
    print("=" * 60)

    # Validate environment
    if not GITHUB_TOKEN:
        print("❌ ERROR: GITHUB_TOKEN not set in .env")
        print("📖 Get your token from: https://github.com/settings/tokens")
        return

    # Load dataset
    if not os.path.exists(input_file):
        print(f"❌ ERROR: {input_file} not found")
        print("💡 Run collect_responses.py first")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        dataset = [json.loads(line) for line in f]

    print(f"📊 Evaluating {len(dataset)} responses...")
    print(f"🤖 Model: {GITHUB_MODEL}")
    print()

    results = []
    total_coherence = 0
    total_fluency = 0
    total_relevance = 0

    for i, item in enumerate(dataset, 1):
        query = item.get("query", "")
        response = item.get("response", "")
        context = item.get("context", "")

        print(f"[{i}/{len(dataset)}] Evaluating: {query[:50]}...")

        # Run evaluations
        coherence = evaluate_coherence(query, response, context)
        time.sleep(2)  # Rate limiting: wait 2 seconds between requests

        fluency = evaluate_fluency(query, response)
        time.sleep(2)

        relevance = evaluate_relevance(query, response, context)
        time.sleep(2)

        result = {
            "query": query,
            "response": response,
            "context": context,
            "metrics": {"coherence": coherence, "fluency": fluency, "relevance": relevance},
        }

        results.append(result)

        total_coherence += coherence.get("score", 0)
        total_fluency += fluency.get("score", 0)
        total_relevance += relevance.get("score", 0)

        print(f"  Coherence: {coherence.get('score', 0)}/5")
        print(f"  Fluency: {fluency.get('score', 0)}/5")
        print(f"  Relevance: {relevance.get('score', 0)}/5")
        print()

    # Calculate averages
    num_items = len(dataset)
    avg_coherence = total_coherence / num_items if num_items > 0 else 0
    avg_fluency = total_fluency / num_items if num_items > 0 else 0
    avg_relevance = total_relevance / num_items if num_items > 0 else 0

    summary = {
        "model": GITHUB_MODEL,
        "total_evaluated": num_items,
        "average_scores": {
            "coherence": round(avg_coherence, 2),
            "fluency": round(avg_fluency, 2),
            "relevance": round(avg_relevance, 2),
        },
        "detailed_results": results,
    }

    # Save results
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "evaluation_results.json")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("=" * 60)
    print("✅ Evaluation Complete!")
    print(f"📊 Results saved to: {output_file}")
    print()
    print("📈 Summary:")
    print(f"  Average Coherence: {avg_coherence:.2f}/5")
    print(f"  Average Fluency: {avg_fluency:.2f}/5")
    print(f"  Average Relevance: {avg_relevance:.2f}/5")
    print()
    print("💰 Cost: FREE (GitHub Models)")


if __name__ == "__main__":
    run_evaluation()
