import json

with open('classification_results(1).json', 'r') as f:
    classification = {x['convId']: x['llm_category'] for x in json.load(f)}

with open('PapyrusAI_courses_test.json', 'r') as f:
    data = json.load(f)

for course in data:
    for module in course.get('modules', []):
        for conv in module.get('conversations', []):
            cid = conv.get('id')
            if cid in classification:
                conv['classification'] = classification[cid]

with open('classification.json', 'w') as f:
    json.dump(data, f, indent=2) 