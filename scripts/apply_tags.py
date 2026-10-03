"""Apply scripts/tags.map.json to src/data/questions.json and write src/data/tags.json.
Run from the repo root: python3 scripts/apply_tags.py
The map (tag -> question ids) is the source of truth; re-running is idempotent."""
import json, sys
m = json.load(open('scripts/tags.map.json'))
data = json.load(open('src/data/questions.json'))
byid = {q['id']: q for q in data['questions']}
for q in data['questions']:
    q['tags'] = []
tags, problems = [], []
for kind in ('subject', 'skill'):
    for tid, t in m[kind].items():
        for qid in t['questions']:
            if qid not in byid: problems.append(f'unknown question {qid} in {tid}'); continue
            if tid in byid[qid]['tags']: problems.append(f'duplicate {tid} on {qid}'); continue
            byid[qid]['tags'].append(tid)
        tags.append({'id': tid, 'label': t['label'], 'kind': kind, 'count': len(t['questions'])})
for q in data['questions']:
    # subject tags first, then skill tags
    order = {t['id']: i for i, t in enumerate(tags)}
    q['tags'].sort(key=lambda x: order[x])
    if not any(t in m['subject'] for t in q['tags']): problems.append(f"{q['id']} has no subject tag")
json.dump(data, open('src/data/questions.json', 'w'), indent=2, ensure_ascii=False); open('src/data/questions.json', 'a').write('\n')
json.dump({'tags': tags}, open('src/data/tags.json', 'w'), indent=2, ensure_ascii=False); open('src/data/tags.json', 'a').write('\n')
print('tags:', len(tags), '| subject:', len(m['subject']), '| skill:', len(m['skill']))
print('problems:', problems or 'none')
