import os
import json
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
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from rag_simulator import RagSimulator

# Load environment variables
# Load environment variables from root
load_dotenv(dotenv_path="../../.env")


def run_system_evaluation():
    print("Starting NEXUS V1 RAGAS Evaluation...")

    if not os.getenv("GOOGLE_API_KEY"):
        os.environ["GOOGLE_API_KEY"] = (
            os.getenv("GOOGLE_GENAI_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
        )

    if not os.environ.get("GOOGLE_API_KEY"):
        raise ValueError(
            "GOOGLE_API_KEY (or GEMINI_API_KEY/GOOGLE_GENAI_API_KEY) not found"
        )

    # Initialize Models (OpenAI Default due to Gemini key issues)
    # Check OPENAI_API_KEY
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError(
            "OPENAI_API_KEY not found. Gemini keys are invalid, need OpenAI."
        )

    try:
        from langchain_openai import ChatOpenAI, OpenAIEmbeddings

        llm = ChatOpenAI(model="gpt-4o-mini")
        embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
        print("Using OpenAI for evaluation.")
    except Exception as e:
        print(f"OpenAI init failed: {e}")
        raise e

    # Wrap for RAGAS
    ragas_llm = LangchainLLMWrapper(llm)
    ragas_embeddings = LangchainEmbeddingsWrapper(embeddings_model)

    # Initialize RAG Simulator (Real codebase access)
    simulator = RagSimulator(root_dir="../../")

    # Load Ground Truth
    with open("dataset/ground_truth.json", "r") as f:
        ground_truth_data = json.load(f)["samples"]

    questions = []
    answers = []
    contexts_list = []
    ground_truths = []

    print(f"Processing {len(ground_truth_data)} samples...")

    for sample in ground_truth_data:
        q = sample["question"]
        gt = sample["ground_truth"]

        # 1. Retrieve Context using Simulator (Backend Logic Port)
        _, contexts = simulator.get_context(q)

        # 2. Generate Answer using Gemini
        # We simulate the prompt that AIService would send
        prompt = f"Use the following context to answer the question: {q}\n\nContext:\n{' '.join(contexts[:3])}"
        response = llm.invoke(prompt)
        a = response.content

        questions.append(q)
        answers.append(a)
        contexts_list.append(contexts[:3])  # Ragas expects a list of strings
        ground_truths.append(gt)
        print(f"  - Evaluated: {q[:30]}...")

    # Build RAGAS Dataset
    data = {
        "question": questions,
        "answer": answers,
        "contexts": contexts_list,
        "ground_truth": ground_truths,
    }
    dataset = Dataset.from_dict(data)

    # Run Evaluation
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

    # Save to Results
    output_dir = "results"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    df = results.to_pandas()
    df.to_csv(os.path.join(output_dir, "nexus_ragas_report.csv"), index=False)

    # Summary for artifact
    summary = {
        "faithfulness": results["faithfulness"],
        "answer_relevancy": results["answer_relevancy"],
        "context_precision": results["context_precision"],
        "context_recall": results["context_recall"],
    }
    with open(os.path.join(output_dir, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)


if __name__ == "__main__":
    run_system_evaluation()
