#!/usr/bin/env python3
"""
Apply key points from scripts/key_points/*.json to src/data/questions.json.

Similar to apply_variants.py, this:
1. Reads all topic files from scripts/key_points/
2. Merges them into questions.json
3. Validates that the base senior_answer text still matches
4. Reports any mismatches (indicating the answer changed)
"""

import json
import sys
from pathlib import Path

def main():
    questions_file = Path('src/data/questions.json')
    key_points_dir = Path('scripts/key_points')
    
    # Read current questions
    with open(questions_file, 'r') as f:
        data = json.load(f)
    
    questions = data['questions']
    q_map = {q['id']: q for q in questions}
    
    # Read all key_points from topic files
    all_key_points = {}
    errors = []
    
    for kp_file in sorted(key_points_dir.glob('*.json')):
        with open(kp_file, 'r') as f:
            topic_data = json.load(f)
        
        for entry in topic_data.get('key_points', []):
            qid = entry['id']
            base_text = entry['base']
            points = entry['points']
            
            if qid not in q_map:
                errors.append(f"Question {qid} in {kp_file.name} not found in questions.json")
                continue
            
            # Validate that the base text still matches
            actual_base = q_map[qid]['senior_answer'][:100]
            if actual_base != base_text:
                errors.append(
                    f"  {qid}: senior_answer changed (key_points base is outdated)\n"
                    f"    Expected: {base_text[:80]}...\n"
                    f"    Got: {actual_base[:80]}..."
                )
            
            all_key_points[qid] = points
    
    if errors:
        print("Errors found:")
        for err in errors:
            print(f"  {err}")
        print(f"\n{len(errors)} error(s). Key points NOT applied.")
        return 1
    
    # Apply key points to questions
    applied = 0
    skipped = 0
    
    for q in questions:
        qid = q['id']
        if qid in all_key_points:
            q['key_points'] = all_key_points[qid]
            applied += 1
        else:
            # Ensure field exists even if empty (for consistency)
            if 'key_points' not in q:
                q['key_points'] = []
            skipped += 1
    
    # Write back to questions.json
    with open(questions_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Key points applied successfully:")
    print(f"  Applied to {applied} questions")
    print(f"  Not included: {skipped} questions (no key_points extracted)")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())

