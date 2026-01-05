"""
Simple evaluation metrics (pure Python)
"""
from typing import Iterable

def accuracy(y_true: Iterable[int], y_pred: Iterable[int]) -> float:
    y_t = list(y_true)
    y_p = list(y_pred)
    if not y_t:
        return 0.0
    correct = sum(1 for a, b in zip(y_t, y_p) if a == b)
    return correct / len(y_t)

def precision(y_true: Iterable[int], y_pred: Iterable[int]) -> float:
    y_t = list(y_true)
    y_p = list(y_pred)
    tp = sum(1 for a, b in zip(y_t, y_p) if b == 1 and a == 1)
    fp = sum(1 for a, b in zip(y_t, y_p) if b == 1 and a == 0)
    if tp + fp == 0:
        return 0.0
    return tp / (tp + fp)

def recall(y_true: Iterable[int], y_pred: Iterable[int]) -> float:
    y_t = list(y_true)
    y_p = list(y_pred)
    tp = sum(1 for a, b in zip(y_t, y_p) if b == 1 and a == 1)
    fn = sum(1 for a, b in zip(y_t, y_p) if b == 0 and a == 1)
    if tp + fn == 0:
        return 0.0
    return tp / (tp + fn)

def f1_score(y_true: Iterable[int], y_pred: Iterable[int]) -> float:
    p = precision(y_true, y_pred)
    r = recall(y_true, y_pred)
    if p + r == 0:
        return 0.0
    return 2 * (p * r) / (p + r)

if __name__ == "__main__":
    # quick smoke test
    y_true = [1, 0, 1, 1, 0]
    y_pred = [1, 0, 0, 1, 0]
    print("accuracy", accuracy(y_true, y_pred))
    print("precision", precision(y_true, y_pred))
    print("recall", recall(y_true, y_pred))
    print("f1", f1_score(y_true, y_pred))
