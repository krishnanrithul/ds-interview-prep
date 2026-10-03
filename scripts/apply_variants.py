"""Apply follow-up variants from scripts/variants/*.json to src/data/questions.json.
Run from the repo root: python3 scripts/apply_variants.py

Each variants file maps a question id to a list with one entry per follow-up, in order:
  {"ml-001": [{"base": "<follow-up text>", "draft": true, "variants": ["...", "..."]}, ...]}
- "base" must match the follow-up's current text. If someone edits a follow-up, the script
  refuses to apply stale variants for it until the variants file is updated.
- "draft": true marks variants as unreviewed. Flip it to false once you've checked them.
The variants files are the source of truth; re-running is idempotent."""
import glob, json, sys

QPATH = 'src/data/questions.json'
data = json.load(open(QPATH))
byid = {q['id']: q for q in data['questions']}

problems, applied, files = [], 0, sorted(glob.glob('scripts/variants/*.json'))
for q in data['questions']:
    for fu in q['follow_ups']:
        fu.pop('variants', None)

for path in files:
    for qid, entries in json.load(open(path)).items():
        q = byid.get(qid)
        if not q:
            problems.append(f'{path}: unknown question {qid}'); continue
        if len(entries) != len(q['follow_ups']):
            problems.append(f'{qid}: {len(entries)} entries but {len(q["follow_ups"])} follow-ups'); continue
        for k, (e, fu) in enumerate(zip(entries, q['follow_ups'])):
            if e['base'] != fu['text']:
                problems.append(f'{qid} follow-up {k + 1}: text changed since variants were written, skipped'); continue
            texts = [t.strip() for t in e['variants']]
            seen = {fu['text'].strip().lower()}
            ok = []
            for t in texts:
                if not t or len(t) > 300: problems.append(f'{qid} follow-up {k + 1}: empty or over 300 chars'); continue
                if t.lower() in seen: problems.append(f'{qid} follow-up {k + 1}: duplicate variant'); continue
                seen.add(t.lower()); ok.append(t)
            if ok:
                fu['variants'] = [{'text': t, 'draft': bool(e.get('draft', True))} for t in ok]
                applied += len(ok)

json.dump(data, open(QPATH, 'w'), indent=2, ensure_ascii=False); open(QPATH, 'a').write('\n')
print('files:', len(files), '| variants applied:', applied)
print('problems:', problems or 'none')
sys.exit(1 if problems else 0)
