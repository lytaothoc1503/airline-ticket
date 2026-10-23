#!/usr/bin/env python3
"""FlightBook Preview Gateway – phục vụ bản xem trước tại http://0.0.0.0:8765"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent / "preview"
PORT = 8765

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("[preview] " + (fmt % args) + "\n")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    if not (ROOT / "index.html").exists():
        print("ERROR: thiếu preview/index.html", file=sys.stderr)
        sys.exit(1)
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"FlightBook Preview: http://127.0.0.1:{PORT}/")
    print(f"Serving: {ROOT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
