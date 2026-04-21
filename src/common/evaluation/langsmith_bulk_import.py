"""
Bulk import repo JSONL evaluation scenarios into separate LangSmith datasets.

Example:
python -m src.common.evaluation.langsmith_bulk_import \
  --scenarios-dir src/common/evaluation/scenarios \
  --dataset-prefix repo-evals \
  --max-examples 10 \
  --exclude ecommerce_customer_support_evaluation_set
"""
from __future__ import annotations

import argparse
from pathlib import Path

from src.common.evaluation.langsmith_dataset_import import import_dataset


def default_dataset_name(prefix: str, stem: str, max_examples: int | None) -> str:
    suffix = f"-sample-{max_examples}" if max_examples is not None else ""
    return f"{prefix}-{stem.replace('_', '-')}{suffix}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk import repo evaluation scenario files into LangSmith datasets.")
    parser.add_argument("--scenarios-dir", default="src/common/evaluation/scenarios")
    parser.add_argument("--dataset-prefix", default="repo-evals")
    parser.add_argument("--split", default="default")
    parser.add_argument("--max-examples", type=int, default=10)
    parser.add_argument("--exclude", action="append", default=[], help="Scenario stem to skip. Can be repeated.")
    args = parser.parse_args()

    scenario_dir = Path(args.scenarios_dir)
    for path in sorted(scenario_dir.glob("*.jsonl")):
        if path.stem in set(args.exclude):
            continue
        dataset_name = default_dataset_name(args.dataset_prefix, path.stem, args.max_examples)
        description = f"Imported from {path.name} with max_examples={args.max_examples}."
        print(f"Importing {path.name} -> {dataset_name}")
        import_dataset(
            dataset_file=str(path),
            dataset_name=dataset_name,
            description=description,
            split=args.split,
            max_examples=args.max_examples,
        )


if __name__ == "__main__":
    main()
