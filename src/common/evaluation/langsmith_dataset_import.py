"""
Import repo JSONL evaluation scenarios into a LangSmith dataset for visual inspection
and Studio experiments.

Example:
python -m src.common.evaluation.langsmith_dataset_import \
  --dataset-file src/common/evaluation/scenarios/ecommerce_customer_support_evaluation_set.jsonl \
  --dataset-name ecommerce-customer-support-evals
"""
from __future__ import annotations

import argparse
import json
import pathlib
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - fallback for minimal environments
    def load_dotenv() -> bool:
        return False

from langsmith import Client, schemas

load_dotenv()


def scenario_to_langsmith_example(raw_line: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    record = json.loads(raw_line)

    inputs: dict[str, Any] = {
        "messages": record.get("input", []),
    }

    reserved_output_keys = {"expected_function_call", "expected", "expected_routing"}
    reserved_meta_keys = {"sample_id", "_source_file"}
    reserved_input_keys = {"input"} | reserved_output_keys | reserved_meta_keys

    for key, value in record.items():
        if key in reserved_input_keys:
            continue
        inputs[key] = value

    expected_call = record.get("expected_function_call")
    outputs: dict[str, Any] = {}
    if expected_call:
        outputs["expected_function_call"] = expected_call

    if "expected" in record:
        outputs["expected"] = record["expected"]

    if "expected_routing" in record:
        outputs["expected_routing"] = record["expected_routing"]

    metadata = {
        "sample_id": record.get("sample_id"),
        "source_file": record.get("_source_file"),
    }

    return inputs, outputs, metadata


def ensure_dataset(
    client: Client,
    dataset_name: str,
    description: str,
) -> Any:
    existing = list(client.list_datasets(dataset_name=dataset_name))
    if existing:
        return existing[0]

    return client.create_dataset(
        dataset_name,
        description=description,
        data_type=schemas.DataType.kv,
        inputs_schema={
            "type": "object",
            "properties": {
                "messages": {"type": "array"},
                "order": {"type": "object"},
                "account": {"type": "object"},
                "patient": {"type": "object"},
                "ticket": {"type": "object"},
                "matter": {"type": "object"},
                "incident": {"type": "object"},
                "operation": {"type": "object"},
            },
            "required": ["messages"],
            "additionalProperties": True,
        },
        outputs_schema={
            "type": "object",
            "properties": {
                "expected_function_call": {"type": "object"},
                "expected": {"type": "object"},
            },
            "additionalProperties": True,
        },
        metadata={"source": "repo-jsonl-evals"},
    )


def import_dataset(
    dataset_file: str,
    dataset_name: str,
    description: str,
    split: str | None,
    max_examples: int | None,
) -> None:
    client = Client()
    dataset = ensure_dataset(client, dataset_name, description)

    path = pathlib.Path(dataset_file)
    inputs: list[dict[str, Any]] = []
    outputs: list[dict[str, Any]] = []
    metadata: list[dict[str, Any]] = []
    splits: list[str | None] = []

    for raw_line in path.read_text().splitlines():
        if not raw_line.strip():
            continue
        row = json.loads(raw_line)
        row["_source_file"] = str(path)
        prepared_inputs, prepared_outputs, prepared_metadata = scenario_to_langsmith_example(json.dumps(row))
        inputs.append(prepared_inputs)
        outputs.append(prepared_outputs)
        metadata.append(prepared_metadata)
        splits.append(split)
        if max_examples is not None and len(inputs) >= max_examples:
            break

    if not inputs:
        raise ValueError(f"No examples found in {dataset_file}")

    client.create_examples(
        dataset_id=dataset.id,
        inputs=inputs,
        outputs=outputs,
        metadata=metadata,
        splits=splits,
    )

    print(f"Imported {len(inputs)} examples into LangSmith dataset '{dataset_name}'.")
    print("Next step:")
    print("1. Open LangSmith -> Datasets & Experiments.")
    print("2. Open the dataset and inspect the Examples tab.")
    print("3. In Studio, click 'Run experiment' and select this dataset.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import repo JSONL eval scenarios into a LangSmith dataset.")
    parser.add_argument("--dataset-file", required=True, help="Path to the repo JSONL evaluation file.")
    parser.add_argument("--dataset-name", required=True, help="Target LangSmith dataset name.")
    parser.add_argument("--description", default="Imported from repo JSONL evaluation scenarios.")
    parser.add_argument("--split", default="default", help="Optional dataset split name.")
    parser.add_argument("--max-examples", type=int, default=None, help="Optional cap on imported examples.")
    args = parser.parse_args()

    import_dataset(
        dataset_file=args.dataset_file,
        dataset_name=args.dataset_name,
        description=args.description,
        split=args.split,
        max_examples=args.max_examples,
    )


if __name__ == "__main__":
    main()
