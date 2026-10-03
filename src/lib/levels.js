// Level comes from the existing difficulty field; type comes from the question's `kind`.
export const LEVELS = [
  { id: 'easy', label: 'Foundations', hint: 'Core definitions and first-principles reasoning' },
  { id: 'medium', label: 'Core', hint: 'Applied questions you should expect in most loops' },
  { id: 'hard', label: 'Advanced', hint: 'Senior-level judgment, trade-offs and ambiguity' },
]
export const KINDS = [
  { id: 'concept', label: 'Concepts', hint: 'Explain an idea clearly' },
  { id: 'implementation', label: 'Code & queries', hint: 'Write the SQL or Python' },
  { id: 'case', label: 'Scenarios', hint: 'Debug or decide in a realistic situation' },
  { id: 'design', label: 'System design', hint: 'Design the system end to end' },
]
export const levelLabel = (id) => LEVELS.find((l) => l.id === id)?.label || id
export const kindLabel = (id) => KINDS.find((k) => k.id === id)?.label || id
