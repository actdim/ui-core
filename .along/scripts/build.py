#!/usr/bin/env python3
# Status: configured
import os
import subprocess
import sys

def main():
    pkg_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    print(f"Running pnpm build in {pkg_dir}")
    res = subprocess.run(["pnpm", "build"], cwd=pkg_dir, shell=True)
    if res.returncode != 0:
        print(f"Build failed with exit code {res.returncode}")
        sys.exit(res.returncode)
    print("All @actdim/ui-core build artifacts generated.")
    sys.exit(0)

if __name__ == "__main__":
    main()

