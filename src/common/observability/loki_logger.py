import requests
import time
import json

def log_to_loki(label: str, message: str):
    url = "http://localhost:3100/loki/api/v1/push"
    headers = {"Content-Type": "application/json"}
    log_entry = {
        "streams": [{
            "stream": { "app": label },
            "values": [[str(int(time.time() * 1e9)), message]]
        }]
    }
    try:
        response = requests.post(url, data=json.dumps(log_entry), headers=headers, timeout=2)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception:
        # Loki not running, that's OK for testing
        pass

if __name__ == '__main__':
    log_to_loki("llm", "This is a test log from TraceLoop LLM call")
