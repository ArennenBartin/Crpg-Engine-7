import json

with open('/Users/brennenarotin/.gemini/antigravity/brain/bce44728-48de-493e-b496-b4ffb8e0a150/.system_generated/logs/transcript.jsonl', 'r') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('step_index') == 7:
            print(f"Content length: {len(obj.get('content', ''))}")
            # print the first 100 chars and last 100 chars
            c = obj.get('content', '')
            print(c[:100])
            print("...")
            print(c[-100:])

