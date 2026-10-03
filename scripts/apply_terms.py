"""Apply scripts/terms.map.json: write `terms` (ids) onto each question and src/data/glossary.json.
Key terms are words and phrases that appear in the question itself, with a short neutral definition.
Definitions must not give away the answer. Run from the repo root: python3 scripts/apply_terms.py"""
import json
m = json.load(open('scripts/terms.map.json'))
tags = {t['id'] for t in json.load(open('src/data/tags.json'))['tags']}
data = json.load(open('src/data/questions.json'))
problems, used = [], set()
for q in data['questions']:
    ids = m['questions'].get(q['id'], [])
    if not ids: problems.append(f"{q['id']} has no key terms")
    for t in ids:
        if t not in m['terms']: problems.append(f"unknown term {t} on {q['id']}")
        used.add(t)
    q['terms'] = ids
for q in m['questions']:
    if q not in {x['id'] for x in data['questions']}: problems.append(f'unknown question {q}')
for tid, t in m['terms'].items():
    if t.get('tag') and t['tag'] not in tags: problems.append(f"{tid}: unknown tag {t['tag']}")
    if tid not in used: problems.append(f'unused term {tid}')
glossary = [{'id': k, **v} for k, v in m['terms'].items() if k in used]
json.dump(data, open('src/data/questions.json', 'w'), indent=2, ensure_ascii=False); open('src/data/questions.json', 'a').write('\n')
json.dump({'terms': glossary}, open('src/data/glossary.json', 'w'), indent=2, ensure_ascii=False); open('src/data/glossary.json', 'a').write('\n')
print('terms:', len(glossary), '| questions:', len(data['questions']), '| problems:', problems or 'none')
