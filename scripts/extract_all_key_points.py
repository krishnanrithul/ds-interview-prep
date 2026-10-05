#!/usr/bin/env python3
"""Extract 4–6 key points from ALL senior answers (remaining 114 questions)."""

import json
import re
from pathlib import Path

def extract_key_points_heuristic(text):
    """Extract 4-6 key points from senior answer text."""
    if not text:
        return []
    
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    min_length = 15
    substantive = [s.strip() for s in sentences if len(s.strip()) >= min_length]
    
    if len(substantive) <= 6:
        return substantive
    
    def priority_score(sent):
        score = 0
        starters = ["I'd ", "First", "Then", "The ", "If ", "When", "Finally", 
                   "Also", "However", "But", "Instead", "Avoid", "Always", "Never"]
        if any(sent.startswith(s) for s in starters):
            score += 3
        
        keywords = ["define", "constraint", "trade-off", "edge case", "scale", 
                   "optimize", "validate", "handle", "measure", "business", "decision"]
        if any(kw in sent.lower() for kw in keywords):
            score += 2
        
        score += min(len(sent) / 100, 1)
        return score
    
    sorted_sents = sorted(substantive, key=priority_score, reverse=True)
    result = sorted(sorted_sents[:6], key=lambda s: substantive.index(s))
    
    return result[:6] if len(result) >= 4 else sorted_sents[:4]


def main():
    with open('src/data/questions.json', 'r') as f:
        data = json.load(f)
    
    questions = data['questions']
    
    # Find questions that don't have key_points yet
    needs_extraction = [q for q in questions if not q.get('key_points')]
    
    print(f"Questions needing key point extraction: {len(needs_extraction)}")
    
    # Extract key points
    results = {}
    for q in needs_extraction:
        qid = q['id']
        senior_answer = q.get('senior_answer', '')
        key_points = extract_key_points_heuristic(senior_answer)
        results[qid] = {
            'topic': q['topic'],
            'key_points': key_points,
            'count': len(key_points)
        }
    
    # Save to intermediate JSON for review
    output_file = 'scripts/key_points_remaining_extracted.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Extracted key points saved to {output_file}")
    
    # Print summary by topic
    print(f"\nSummary by topic:")
    by_topic = {}
    for r in results.values():
        topic = r['topic']
        if topic not in by_topic:
            by_topic[topic] = []
        by_topic[topic].append(r['count'])
    
    for topic in sorted(by_topic.keys()):
        counts = by_topic[topic]
        avg = sum(counts) / len(counts) if counts else 0
        print(f"  {topic}: {len(counts)} questions, avg {avg:.1f} points/q")
    
    # Overall stats
    total_points = sum(r['count'] for r in results.values())
    avg_points = total_points / len(results) if results else 0
    print(f"\nTotal: {len(results)} questions, avg {avg_points:.1f} points/q")
    
    # Point distribution
    counts_dist = {}
    for r in results.values():
        c = r['count']
        counts_dist[c] = counts_dist.get(c, 0) + 1
    
    print(f"\nPoint distribution:")
    for count in sorted(counts_dist.keys()):
        print(f"  {counts_dist[count]} questions with {count} points")

if __name__ == '__main__':
    main()

