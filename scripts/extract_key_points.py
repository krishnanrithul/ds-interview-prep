#!/usr/bin/env python3
"""Extract 4-6 key points from senior answers for ML and real-interview questions."""

import json
import re
from pathlib import Path

def extract_key_points_heuristic(text):
    """
    Extract 4-6 key points from senior answer text.
    
    Strategy:
    1. Split by sentence boundaries
    2. Filter for substantive sentences (not fluff)
    3. Group related concepts
    4. Return top 4-6 points
    """
    if not text:
        return []
    
    # Split into sentences (simple regex)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    
    # Filter out very short sentences and metadata
    min_length = 15
    substantive = [s.strip() for s in sentences if len(s.strip()) >= min_length]
    
    if len(substantive) <= 6:
        # If already concise, return as-is
        return substantive
    
    # For longer answers, prefer:
    # - Sentences starting with "I'd", "First", "Then", "The", "If", "When"
    # - Sentences mentioning business logic, constraints, trade-offs
    # - Longer sentences (typically more substantive)
    
    def priority_score(sent):
        score = 0
        
        # Starter phrases that indicate key concepts
        starters = ["I'd ", "First", "Then", "The ", "If ", "When", "Finally", 
                   "Also", "However", "But", "Instead", "Avoid", "Always", "Never"]
        if any(sent.startswith(s) for s in starters):
            score += 3
        
        # Business/technical keywords that indicate substance
        keywords = ["define", "constraint", "trade-off", "edge case", "scale", 
                   "optimize", "validate", "handle", "measure", "business"]
        if any(kw in sent.lower() for kw in keywords):
            score += 2
        
        # Length bonus (longer = more substantive)
        score += min(len(sent) / 100, 1)
        
        return score
    
    # Sort by priority and take top 4-6
    sorted_sents = sorted(substantive, key=priority_score, reverse=True)
    result = sorted(sorted_sents[:6], key=lambda s: substantive.index(s))  # Re-sort by original order
    
    return result[:6] if len(result) >= 4 else sorted_sents[:4]


def main():
    with open('src/data/questions.json', 'r') as f:
        data = json.load(f)
    
    questions = data['questions']
    
    # Identify priority questions
    ml_questions = [q for q in questions if q.get('topic') == 'ML']
    real_interview_qs = [q for q in questions if 'draft' not in q]
    
    # Get unique priority questions
    priority_ids = {q['id'] for q in ml_questions + real_interview_qs}
    priority_qs = [q for q in questions if q['id'] in priority_ids]
    
    print(f"Extracting key points for {len(priority_qs)} priority questions:")
    print(f"  - {len(ml_questions)} ML questions")
    print(f"  - {len(real_interview_qs)} real-interview questions")
    
    # Extract key points
    results = {}
    for q in priority_qs:
        qid = q['id']
        senior_answer = q.get('senior_answer', '')
        key_points = extract_key_points_heuristic(senior_answer)
        results[qid] = {
            'topic': q['topic'],
            'question': q['question'][:80] + '...' if len(q['question']) > 80 else q['question'],
            'key_points': key_points,
            'count': len(key_points)
        }
    
    # Save to intermediate JSON for review
    output_file = 'scripts/key_points_extracted.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nExtracted key points saved to {output_file}")
    
    # Print summary
    print(f"\nSummary:")
    counts = {}
    for r in results.values():
        c = r['count']
        counts[c] = counts.get(c, 0) + 1
    
    for count in sorted(counts.keys()):
        print(f"  {counts[count]} questions with {count} key points")
    
    # Show first 3 examples
    print(f"\nFirst 3 examples:")
    for i, (qid, result) in enumerate(list(results.items())[:3]):
        print(f"\n{i+1}. {qid} ({result['topic']}) - {result['count']} points")
        print(f"   Q: {result['question']}")
        for j, point in enumerate(result['key_points'], 1):
            print(f"   {j}. {point[:100]}{'...' if len(point) > 100 else ''}")


if __name__ == '__main__':
    main()

