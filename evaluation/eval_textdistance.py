import asyncio
import json

import aiofiles
import evaluate
import textdistance


# Evaluación asíncrona con nombres PEP8
async def main():
    async with aiofiles.open("evaluation/data.jsonl", "r", encoding="utf-8") as f:
        lines = await f.readlines()
        data = [json.loads(line) for line in lines]

    bleu = evaluate.load("bleu")
    rouge = evaluate.load("rouge")

    results = []
    for item in data:
        query = item["query"]
        response = item["response"]
        jaccard_score = textdistance.jaccard.normalized_similarity(query, response)
        levenshtein_score = textdistance.levenshtein.normalized_similarity(query, response)
        bleu_score = bleu.compute(predictions=[response], references=[[query]])["bleu"]
        rouge_score = rouge.compute(predictions=[response], references=[query])["rougeL"]
        results.append(
            {
                "query": query,
                "response": response,
                "jaccard": jaccard_score,
                "levenshtein": levenshtein_score,
                "bleu": bleu_score,
                "rougeL": rouge_score,
            }
        )

    async with aiofiles.open("evaluation/textdistance_results.json", "w", encoding="utf-8") as f:
        await f.write(json.dumps(results, ensure_ascii=False, indent=2))

    print("Evaluación completada. Resultados guardados en evaluation/textdistance_results.json")


if __name__ == "__main__":
    asyncio.run(main())
