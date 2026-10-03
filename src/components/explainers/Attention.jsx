import { useMemo, useState } from 'react'
import Shell, { Slider } from './Shell.jsx'

// Hand-made 4-number vectors for each word so the arithmetic is readable.
// Dimensions, loosely: [is a creature, is an action, is a place or object, is a function word].
// Each word has a key (what it offers) and a query (what it looks for); the query is the key unless a third entry is given.
const WORDS = [
  ['The', [0.1, 0, 0, 0.9]], ['cat', [1, 0, 0.1, 0]], ['chased', [0.2, 1, 0, 0]], ['the', [0.1, 0, 0, 0.9]],
  ['mouse', [0.7, 0, 0.2, 0]], ['because', [0, 0.2, 0, 0.8]], ['it', [0.3, 0, 0, 0.7], [1, 0, 0, 0]], ['was', [0, 0.3, 0, 0.7]], ['hungry', [0.5, 0.3, 0, 0]],
]
const D = 4
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)

export default function Attention({ onClose }) {
  const [q, setQ] = useState(6)
  const [scale, setScale] = useState(6)
  const [norm, setNorm] = useState(true)

  const weights = useMemo(() => {
    const qv = WORDS[q][2] || WORDS[q][1]
    const scores = WORDS.map(([, k]) => (dot(qv, k) * scale) / (norm ? Math.sqrt(D) : 1))
    const m = Math.max(...scores)
    const e = scores.map((s) => Math.exp(s - m))
    const sum = e.reduce((a, b) => a + b, 0)
    return { scores, w: e.map((v) => v / sum) }
  }, [q, scale, norm])
  const out = [0, 1, 2, 3].map((d) => WORDS.reduce((s, [, v], i) => s + weights.w[i] * v[d], 0))
  const top = weights.w.indexOf(Math.max(...weights.w))
  const ent = -weights.w.reduce((s, p) => s + p * Math.log2(p || 1), 0)

  return (
    <Shell title="Attention: who looks at whom" intro="To update the meaning of one word, a transformer scores every word in the sentence against it, turns the scores into weights that sum to 1, and takes a weighted blend. Pick a word."
      onClose={onClose}
      note="The word vectors here are hand-made so the numbers are readable; in a trained model they are learned and have hundreds of dimensions, and the query and key vectors are separate learned projections. The mechanism (dot products, softmax, weighted average) is the real one.">
      <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Choose the word that is asking">
        {WORDS.map(([w], i) => (
          <button key={i} onClick={() => setQ(i)} aria-pressed={q === i} className={`px-2.5 py-1.5 rounded-lg text-sm border ${q === i ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'border-border hover:bg-muted'}`}>{w}</button>
        ))}
      </div>
      <div className="space-y-1.5">
        {WORDS.map(([w], i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={`w-16 shrink-0 text-right ${i === q ? 'font-semibold' : 'text-muted-foreground'}`}>{w}{i === q ? ' (asking)' : ''}</span>
            <div className="flex-1 h-4 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${weights.w[i] * 100}%`, transition: 'width 200ms' }} /></div>
            <span className="w-14 text-right tabular-nums">{(weights.w[i] * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <Slider label="Size of the vectors (how confident the scores are)" value={scale} min={0.5} max={8} step={0.5} onChange={setScale} display={scale.toFixed(1)} />
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer self-end"><input type="checkbox" checked={norm} onChange={(e) => setNorm(e.target.checked)} className="w-4 h-4 accent-primary" /> Divide scores by the square root of the dimension</label>
      </div>
      <p className="mt-3 text-sm tabular-nums text-muted-foreground">New vector for "{WORDS[q][0]}": [{out.map((v) => v.toFixed(2)).join(', ')}]. Spread of attention (entropy): {ent.toFixed(2)} bits, maximum {Math.log2(WORDS.length).toFixed(2)}.</p>
      <p className="mt-2 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">
        {`"${WORDS[q][0]}" puts the most weight on "${WORDS[top][0]}" (${(weights.w[top] * 100).toFixed(0)}%). `}
        {scale >= 5 && !norm ? 'With large vectors and no scaling the scores are huge, the softmax saturates, and almost all weight lands on one word: the model stops blending and gradients through the others vanish. That is why scores are divided by the square root of the dimension.'
          : scale <= 1 ? 'With small vectors the scores are nearly equal, so attention is spread almost evenly and the new vector is close to a plain average of the sentence.'
            : q === 6 ? 'For "it", words describing a creature score highest. Which noun "it" points to is decided entirely by the dot products, so the same mechanism that resolves pronouns also mixes in context for every other word.'
              : 'Every word runs this same calculation at once, which is why transformers parallelize well, and also why the cost grows with the square of the sentence length.'}
      </p>
    </Shell>
  )
}
