"""
Pytest configuration and fixtures for AIGestion IA Engine tests.
"""

import asyncio
import sys
from pathlib import Path

import pytest

# Add backend to path
backend_path = Path(__file__).parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def sample_input_data():
    """Sample input data for inference tests."""
    return [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]


@pytest.fixture
def sample_csv_content():
    """Sample CSV content for file inference tests."""
    return b"""1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0
2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0
3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0"""


@pytest.fixture
def sample_json_content():
    """Sample JSON content for file inference tests."""
    import json

    data = [
        {"input_data": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]},
        {"input_data": [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0]},
        {"input_data": [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0]},
    ]
    return json.dumps(data).encode()


@pytest.fixture
def sample_jsonl_content():
    """Sample JSONL content for file inference tests."""
    import json

    lines = [
        json.dumps({"input_data": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]}),
        json.dumps({"input_data": [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0]}),
        json.dumps({"input_data": [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0]}),
    ]
    return "\n".join(lines).encode()


@pytest.fixture
def training_request_data():
    """Sample training request data."""
    return {
        "dataset_path": "./data/test_dataset.csv",
        "epochs": 2,
        "batch_size": 16,
        "learning_rate": 0.001,
        "model_name": "test-model",
    }
