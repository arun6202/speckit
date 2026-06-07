from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


APP_DIR = Path(__file__).resolve().parent
REPO_ROOT = APP_DIR.parent
STATIC_DIR = APP_DIR / "static"
RUN_DIR = Path(os.environ.get("FIA_TRAINING_RUN_DIR", tempfile.gettempdir())) / "fsharp-in-action-training-runs"
MAX_CODE_BYTES = 200_000
RUN_TIMEOUT_SECONDS = 12


class TrainingModeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def log_message(self, format: str, *args) -> None:
        print(f"[training-mode] {self.address_string()} - {format % args}")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self._send_json(
                {
                    "ok": True,
                    "repoRoot": str(REPO_ROOT),
                    "runDir": str(RUN_DIR),
                    "dotnet": self._dotnet_version(),
                }
            )
            return

        if parsed.path == "/api/source":
            query = parse_qs(parsed.query)
            rel_path = query.get("path", [""])[0]
            self._send_source(rel_path)
            return

        if parsed.path == "/":
            self.path = "/index.html"

        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in {"/api/run", "/api/infer"}:
            self.send_error(404, "Unknown endpoint")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length > MAX_CODE_BYTES:
            self.send_error(413, "Code payload is too large")
            return

        try:
            body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(body)
            code = payload.get("code", "")
            if not isinstance(code, str) or not code.strip():
                self.send_error(400, "Request must include non-empty code")
                return

            if parsed.path == "/api/infer":
                result = self._infer_fsharp(code)
            else:
                result = self._run_fsharp(code)
            self._send_json(result)
        except json.JSONDecodeError:
            self.send_error(400, "Request body must be JSON")
        except Exception as ex:
            self._send_json({"ok": False, "exitCode": -1, "stderr": str(ex), "stdout": ""}, status=500)

    def translate_path(self, path: str) -> str:
        # Keep SimpleHTTPRequestHandler constrained to STATIC_DIR.
        path = unquote(urlparse(path).path)
        if path == "/":
            path = "/index.html"
        target = (STATIC_DIR / path.lstrip("/")).resolve()
        if not str(target).startswith(str(STATIC_DIR.resolve())):
            return str(STATIC_DIR / "index.html")
        return str(target)

    def _send_json(self, payload: dict, status: int = 200) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _send_source(self, rel_path: str) -> None:
        try:
            normalized = rel_path.replace("\\", "/").strip("/")
            if not normalized:
                self.send_error(400, "Missing path")
                return

            target = (REPO_ROOT / normalized).resolve()
            if not str(target).startswith(str(REPO_ROOT.resolve())) or not target.is_file():
                self.send_error(404, "Source file not found")
                return

            if target.suffix.lower() not in {".fsx", ".fs", ".fsproj"}:
                self.send_error(400, "Unsupported source file")
                return

            self._send_json(
                {
                    "ok": True,
                    "path": normalized,
                    "content": target.read_text(encoding="utf-8-sig", errors="replace"),
                }
            )
        except Exception as ex:
            self._send_json({"ok": False, "path": rel_path, "content": "", "error": str(ex)}, status=500)

    def _run_fsharp(self, code: str) -> dict:
        RUN_DIR.mkdir(exist_ok=True)
        start = time.perf_counter()
        script_path = None

        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".fsx",
                prefix="lesson-",
                dir=RUN_DIR,
                delete=False,
                encoding="utf-8",
            ) as script:
                script.write(code)
                script.write("\n")
                script_path = Path(script.name)

            run_env = {
                **os.environ,
                "DOTNET_CLI_UI_LANGUAGE": "en",
                "DOTNET_CLI_TELEMETRY_OPTOUT": "1",
                "DOTNET_NOLOGO": "1",
                "DOTNET_SKIP_FIRST_TIME_EXPERIENCE": "1",
            }

            completed = subprocess.run(
                ["dotnet", "fsi", "--exec", str(script_path)],
                cwd=RUN_DIR,
                capture_output=True,
                text=True,
                timeout=RUN_TIMEOUT_SECONDS,
                env=run_env,
            )

            return {
                "ok": completed.returncode == 0,
                "exitCode": completed.returncode,
                "stdout": completed.stdout,
                "stderr": completed.stderr,
                "elapsedMs": round((time.perf_counter() - start) * 1000),
                "timedOut": False,
            }
        except subprocess.TimeoutExpired as ex:
            return {
                "ok": False,
                "exitCode": -1,
                "stdout": ex.stdout or "",
                "stderr": f"Execution timed out after {RUN_TIMEOUT_SECONDS} seconds.",
                "elapsedMs": round((time.perf_counter() - start) * 1000),
                "timedOut": True,
            }
        finally:
            if script_path is not None:
                try:
                    script_path.unlink(missing_ok=True)
                except OSError:
                    pass

    def _infer_fsharp(self, code: str) -> dict:
        RUN_DIR.mkdir(exist_ok=True)
        start = time.perf_counter()
        run_env = {
            **os.environ,
            "DOTNET_CLI_UI_LANGUAGE": "en",
            "DOTNET_CLI_TELEMETRY_OPTOUT": "1",
            "DOTNET_NOLOGO": "1",
            "DOTNET_SKIP_FIRST_TIME_EXPERIENCE": "1",
        }

        try:
            completed = subprocess.run(
                ["dotnet", "fsi", "--nologo"],
                cwd=RUN_DIR,
                input=f"{code}\n#quit;;\n",
                capture_output=True,
                text=True,
                timeout=RUN_TIMEOUT_SECONDS,
                env=run_env,
            )
            raw = "\n".join(part for part in [completed.stdout, completed.stderr] if part)
            return {
                "ok": completed.returncode == 0,
                "exitCode": completed.returncode,
                "stdout": raw,
                "signatures": self._extract_signatures(raw),
                "elapsedMs": round((time.perf_counter() - start) * 1000),
                "timedOut": False,
            }
        except subprocess.TimeoutExpired as ex:
            return {
                "ok": False,
                "exitCode": -1,
                "stdout": ex.stdout or "",
                "signatures": [],
                "stderr": f"Inference timed out after {RUN_TIMEOUT_SECONDS} seconds.",
                "elapsedMs": round((time.perf_counter() - start) * 1000),
                "timedOut": True,
            }

    def _extract_signatures(self, output: str) -> list[str]:
        signatures: list[str] = []
        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith("> "):
                stripped = stripped[2:].strip()
            if stripped.startswith(("val ", "type ", "module ")):
                signatures.append(stripped)
        return signatures

    def _dotnet_version(self) -> str:
        try:
            RUN_DIR.mkdir(exist_ok=True)
            completed = subprocess.run(
                ["dotnet", "--version"],
                cwd=RUN_DIR,
                capture_output=True,
                text=True,
                timeout=5,
            )
            return completed.stdout.strip()
        except Exception:
            return "unknown"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the F# in Action browser training mode.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host. Default: 127.0.0.1")
    parser.add_argument("--port", default=8765, type=int, help="Bind port. Default: 8765")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), TrainingModeHandler)
    url = f"http://{args.host}:{args.port}"
    print(f"F# in Action training mode is running at {url}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping training mode.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
