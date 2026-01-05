"""
Evaluation script for AIGestion Gemini API using AWS Bedrock (alternative to Azure OpenAI)
Uses AWS Bedrock's Claude or other models for LLM-as-Judge evaluation
"""

import json
import os
from typing import Dict

import boto3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_BEDROCK_MODEL = os.getenv("AWS_BEDROCK_MODEL", "anthropic.claude-3-5-sonnet-20241022-v2:0")
AIGESTION_API_URL = os.getenv("AIGESTION_API_URL", "http://localhost:3000")


def get_bedrock_client():
    """Initialize AWS Bedrock client"""
    return boto3.client(
        service_name='bedrock-runtime',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )


def invoke_bedrock_model(prompt: str) -> str:
    """Invoke AWS Bedrock model with prompt"""
    client = get_bedrock_client()

    # Format request for Claude models
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 500,
        "temperature": 0.3,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    try:
        response = client.invoke_model(
            modelId=AWS_BEDROCK_MODEL,
            body=json.dumps(body)
        )

        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']

    except Exception as e:
        raise Exception(f"Bedrock invocation failed: {str(e)}")


def evaluate_coherence(query: str, response: str, context: str = "") -> Dict:
    """Evaluate response coherence using AWS Bedrock"""

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

    try:
        content = invoke_bedrock_model(prompt)

        # Parse JSON response (handle markdown code blocks)
        content_clean = content.strip().strip("```json").strip("```").strip()
        eval_result = json.loads(content_clean)
        return eval_result

    except Exception as e:
        print(f"⚠️ Coherence evaluation failed: {e}")
        return {"score": 0, "reasoning": f"Evaluation error: {str(e)}"}


def evaluate_fluency(query: str, response: str) -> Dict:
    """Evaluate response fluency using AWS Bedrock"""

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

    try:
        content = invoke_bedrock_model(prompt)

        content_clean = content.strip().strip("```json").strip("```").strip()
        eval_result = json.loads(content_clean)
        return eval_result

    except Exception as e:
        print(f"⚠️ Fluency evaluation failed: {e}")
        return {"score": 0, "reasoning": f"Evaluation error: {str(e)}"}


def evaluate_relevance(query: str, response: str, context: str = "") -> Dict:
    """Evaluate response relevance using AWS Bedrock"""

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

    try:
        content = invoke_bedrock_model(prompt)

        content_clean = content.strip().strip("```json").strip("```").strip()
        eval_result = json.loads(content_clean)
        return eval_result

    except Exception as e:
        print(f"⚠️ Relevance evaluation failed: {e}")
        return {"score": 0, "reasoning": f"Evaluation error: {str(e)}"}


def run_evaluation(input_file: str = "test_dataset_with_responses.jsonl", output_dir: str = "results"):
    """Run complete evaluation on collected responses"""

    print("🔍 AIGestion Gemini Evaluation (AWS Bedrock)")
    print("=" * 60)

    # Validate environment
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        print("❌ ERROR: AWS credentials not set in .env")
        print("📖 Configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        print("   Get credentials from: https://console.aws.amazon.com/iam/")
        return

    # Load dataset
    if not os.path.exists(input_file):
        print(f"❌ ERROR: {input_file} not found")
        print("💡 Run collect_responses.py first")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        dataset = [json.loads(line) for line in f]

    print(f"📊 Evaluating {len(dataset)} responses...")
    print(f"🤖 Model: {AWS_BEDROCK_MODEL}")
    print(f"🌍 Region: {AWS_REGION}")
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
        fluency = evaluate_fluency(query, response)
        relevance = evaluate_relevance(query, response, context)

        result = {
            "query": query,
            "response": response,
            "context": context,
            "metrics": {
                "coherence": coherence,
                "fluency": fluency,
                "relevance": relevance
            }
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
        "model": AWS_BEDROCK_MODEL,
        "region": AWS_REGION,
        "total_evaluated": num_items,
        "average_scores": {
            "coherence": round(avg_coherence, 2),
            "fluency": round(avg_fluency, 2),
            "relevance": round(avg_relevance, 2)
        },
        "detailed_results": results
    }

    # Save results
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "evaluation_results_aws.json")

    with open(output_file, 'w', encoding='utf-8') as f:
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
    print("💰 Cost: ~$0.003 per evaluation (Claude 3.5 Sonnet)")


if __name__ == "__main__":
    run_evaluation()
