#!/usr/bin/env python3
"""TaskBoard Load Generator for HPA Stress Testing.

Generates continuous concurrent HTTP requests against FastAPI endpoints to
trigger CPU scaling on Kubernetes Horizontal Pod Autoscaler.
"""

import sys
import time
import argparse
import threading
from urllib.request import Request, urlopen
from urllib.error import URLError

TOTAL_REQUESTS = 0
SUCCESS_COUNT = 0
ERROR_COUNT = 0
LOCK = threading.Lock()


def worker(target_url: str, duration_sec: int, thread_id: int):
    global TOTAL_REQUESTS, SUCCESS_COUNT, ERROR_COUNT
    end_time = time.time() + duration_sec

    while time.time() < end_time:
        try:
            req = Request(target_url, headers={"User-Agent": "TaskBoard-LoadTester/1.0"})
            with urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    with LOCK:
                        SUCCESS_COUNT += 1
                else:
                    with LOCK:
                        ERROR_COUNT += 1
        except URLError:
            with LOCK:
                ERROR_COUNT += 1
        except Exception:
            with LOCK:
                ERROR_COUNT += 1

        with LOCK:
            TOTAL_REQUESTS += 1


def main():
    parser = argparse.ArgumentParser(description="TaskBoard HPA Load Generator")
    parser.add_argument(
        "--url",
        default="http://localhost:8000/api/tasks/stats",
        help="Target API URL (default: http://localhost:8000/api/tasks/stats)",
    )
    parser.add_argument(
        "--threads",
        type=int,
        default=10,
        help="Number of concurrent worker threads (default: 10)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=60,
        help="Test duration in seconds (default: 60)",
    )
    args = parser.parse_args()

    print(f"🔥 Starting Load Test against: {args.url}")
    print(f"⚡ Threads: {args.threads} | Duration: {args.duration}s")
    print("Watch HPA scale in Kubernetes with: kubectl get hpa -n taskboard -w\n")

    threads = []
    start_time = time.time()

    for i in range(args.threads):
        t = threading.Thread(target=worker, args=(args.url, args.duration, i))
        t.start()
        threads.append(t)

    # Monitor progress in main thread
    while any(t.is_alive() for t in threads):
        time.sleep(2)
        elapsed = int(time.time() - start_time)
        with LOCK:
            rps = TOTAL_REQUESTS / max(elapsed, 1)
            print(
                f"[{elapsed}s / {args.duration}s] Requests: {TOTAL_REQUESTS} | "
                f"Success: {SUCCESS_COUNT} | Errors: {ERROR_COUNT} | Rate: {rps:.1f} req/s"
            )

    for t in threads:
        t.join()

    total_time = time.time() - start_time
    print("\n✅ Load Test Finished!")
    print(f"Total Requests: {TOTAL_REQUESTS}")
    print(f"Success Rate:   {(SUCCESS_COUNT / max(TOTAL_REQUESTS, 1)) * 100:.1f}%")
    print(f"Average Rate:   {TOTAL_REQUESTS / total_time:.1f} req/s")


if __name__ == "__main__":
    main()
