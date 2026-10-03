"""Merge question batches into the app data and validate them.

Each file in scripts/batches/*.json looks like:
  { "new_tags":  { "tag-id": {"label": "...", "kind": "subject"} },
    "new_terms": { "term-id": {"label": "...", "definition": "...", "tag": "tag-id", "deeper": "optional"} },
    "questions": [ { id, question, topic, difficulty, frequency, context, follow_ups[{text,intent}],
                     key_insight, junior_answer, senior_answer, tags[], terms[] } ] }

The script appends unseen questions to src/data/questions.json (marked draft), records their tags and
terms in scripts/tags.map.json and scripts/terms.map.json, then runs apply_tags.py and apply_terms.py.
Re-running is safe. Run from the repo root: python3 scripts/add_questions.py"""
import glob, json, re, subprocess, sys

TOPICS = {'SQL', 'ML', 'Statistics', 'System Design', 'Python', 'Production ML', 'LLMs & AI'}
DIFFS = {'easy', 'medium', 'hard'}
KINDS = {'concept', 'implementation', 'case', 'design'}
load = lambda p: json.load(open(p))
dump = lambda p, d: (json.dump(d, open(p, 'w'), indent=2, ensure_ascii=False), open(p, 'a').write('\n'))

data = load('src/data/questions.json')
tagmap, termmap = load('scripts/tags.map.json'), load('scripts/terms.map.json')
have = {q['id'] for q in data['questions']}
problems, added = [], 0

for path in sorted(glob.glob('scripts/batches/*.json')):
    b = load(path)
    for tid, t in b.get('new_tags', {}).items():
        tagmap[t.get('kind', 'subject')].setdefault(tid, {'label': t['label'], 'questions': []})
    for tid, t in b.get('new_terms', {}).items():
        termmap['terms'].setdefault(tid, t)
    for q in b['questions']:
        qid = q['id']
        where = f'{path}:{qid}'
        for f in ('question', 'topic', 'difficulty', 'frequency', 'context', 'key_insight', 'junior_answer', 'senior_answer'):
            if not q.get(f): problems.append(f'{where} missing {f}')
        if q.get('topic') not in TOPICS: problems.append(f"{where} bad topic {q.get('topic')}")
        if q.get('difficulty') not in DIFFS: problems.append(f"{where} bad difficulty")
        if q.get('kind') not in KINDS: problems.append(f"{where} bad kind {q.get('kind')}")
        fus = q.get('follow_ups', [])
        if not 2 <= len(fus) <= 3 or any(not f.get('text') or not f.get('intent') for f in fus):
            problems.append(f'{where} needs 2-3 follow-ups with text and intent')
        all_tags = {t for k in ('subject', 'skill') for t in tagmap[k]}
        for t in q.get('tags', []):
            if t not in all_tags: problems.append(f'{where} unknown tag {t}')
        if not any(t in tagmap['subject'] for t in q.get('tags', [])): problems.append(f'{where} needs a subject tag')
        if not q.get('terms'): problems.append(f'{where} needs at least one key term')
        for t in q.get('terms', []):
            if t not in termmap['terms']: problems.append(f'{where} unknown term {t}')
        if qid in have:
            continue
        # register membership in the maps
        for t in q.get('tags', []):
            for k in ('subject', 'skill'):
                if t in tagmap[k] and qid not in tagmap[k][t]['questions']: tagmap[k][t]['questions'].append(qid)
        termmap['questions'][qid] = q['terms']
        row = {k: v for k, v in q.items() if k not in ('tags', 'terms')}
        row['draft'] = True
        data['questions'].append(row)
        have.add(qid); added += 1

ids = [q['id'] for q in data['questions']]
if len(ids) != len(set(ids)): problems.append('duplicate question ids')
for tid, t in termmap['terms'].items():
    if t.get('tag') and t['tag'] not in {x for k in ('subject', 'skill') for x in tagmap[k]}: problems.append(f'term {tid}: unknown tag {t["tag"]}')
if problems:
    print('PROBLEMS (nothing written):'); [print(' -', p) for p in problems]; sys.exit(1)

dump('src/data/questions.json', data); dump('scripts/tags.map.json', tagmap); dump('scripts/terms.map.json', termmap)
subprocess.run([sys.executable, 'scripts/apply_tags.py'], check=True)
subprocess.run([sys.executable, 'scripts/apply_terms.py'], check=True)
print(f'added {added} questions; total {len(data["questions"])}')
