from __future__ import annotations

import io
import sys
from contextlib import redirect_stdout

from common.frontend.run_explorer import main


if __name__ == "__main__":
    raw_input = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()
    buffer = io.StringIO()
    with redirect_stdout(buffer):
        result = main(raw_input)
    if buffer.getvalue().strip():
        print(buffer.getvalue(), file=sys.stderr, end="")
    print(result)
