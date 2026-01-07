import os
import pandas as pd
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings

# Load environment variables
load_dotenv()

# Verify API Keys
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY not found in environment variables")


def run_evaluation():
    print("Starting RAGAS Evaluation v0.4...")

    # Initialize Models
    gpt4o_mini = ChatOpenAI(model="gpt-4o-mini")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # Wrap models for RAGAS
    ragas_llm = LangchainLLMWrapper(gpt4o_mini)
    ragas_embeddings = LangchainEmbeddingsWrapper(embeddings)

    # Sample Data
    data = {
        "question": [
            "What is NEXUS V1?",
            "How do I reset my password?",
            "Does it support Docker?",
        ],
        "answer": [
            "NEXUS V1 is an advanced AI management platform.",
            "Go to settings and click reset password.",
            "Yes, it runs on Docker containers.",
        ],
        "contexts": [
            ["NEXUS V1 is a platform for managing AI resources."],
            ["User settings allow password resets via email."],
            ["The system is containerized using Docker."],
        ],
        "ground_truth": [
            "NEXUS V1 is an AI platform.",
            "You can reset password in settings.",
            "Docker is supported.",
        ],
    }

    dataset = Dataset.from_dict(data)

    results = evaluate(
        dataset=dataset,
        metrics=[
            context_precision,
            context_recall,
            faithfulness,
            answer_relevancy,
        ],
        llm=ragas_llm,
        embeddings=ragas_embeddings,
    )

    print("\nEvaluation Results:")
    print(results)

    # Save results
    df = results.to_pandas()
    output_dir = "evaluation/ragas/results"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    output_path = os.path.join(output_dir, "latest_run.csv")
    df.to_csv(output_path, index=False)
    print(f"\nResults saved to {output_path}")


if __name__ == "__main__":
    run_evaluation()
