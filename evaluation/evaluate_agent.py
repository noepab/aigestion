from azure.ai.evaluation import CoherenceEvaluator, FluencyEvaluator, evaluate

# Inicializar evaluadores que no requieren modelo
coherence_evaluator = CoherenceEvaluator()
fluency_evaluator = FluencyEvaluator()

# Ejecutar evaluación sobre el dataset JSONL
result = evaluate(
    data="evaluation/data.jsonl",
    evaluators={"coherence": coherence_evaluator, "fluency": fluency_evaluator},
    evaluator_config={
        "coherence": {"column_mapping": {"query": "${data.query}", "response": "${data.response}"}},
        "fluency": {"column_mapping": {"response": "${data.response}"}},
    },
    output_path="evaluation/results.json",
)

print("Evaluación completada. Resultados guardados en evaluation/results.json")

print("Evaluación completada. Resultados guardados en evaluation/results.json")
