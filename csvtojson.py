import csv
import json

INPUT_CSV = "data/single_jeopardy.csv"
OUTPUT_JSON = "data/single_jeopardy.json"

rows = []

with open(INPUT_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        cleaned = {
            "air_date": row["air_date"],
            "round": row["round"],
            "category": row["category"],
            "value": int(float(row["value"])) if row["value"] else None,
            "question": row["question"],
            "answer": row["answer"]
        }
        rows.append(cleaned)

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(rows, f, indent=2, ensure_ascii=False)

print(f"Converted {len(rows)} rows → {OUTPUT_JSON}")
