import { useMemo, useState } from 'react'
import { Dices } from 'lucide-react'
import { rng } from '../../lib/toy.js'
import Shell, { Slider } from './Shell.jsx'

// Illustrative next-token scores (logits) after "The capital of France is".
const TOKENS = [['Paris', 6.2], ['the', 3.6], ['a', 3.0], ['located', 2.6], ['Lyon', 2.2], ['known', 1.8], ['not', 1.2], ['France', 0.4], ['Berlin', 0.2], ['banana', -2.0]]

const softmax = (z) => { const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s) }

export default function Sampling({ onClose }) {
  const [temp, setTemp] = useState(1)
  const [topP, setTopP] = useState(1)
  const [draws, setDraws] = useState(null)
  const [seed, setSeed] = useState(1)

  const { probs, kept, final } = useMemo(() => {
    const probs = softmax(TOKENS.map(([, z]) => z / temp))
    const order = probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0])
    const keep = new Set()
    let cum = 0
    for (const [p, i] of order) { keep.add(i); cum += p; if (cum >= topP) break }
    const mass = [...keep].reduce((s, i) => s + probs[i], 0)
    return { probs, kept: keep, final: probs.map((p, i) => (keep.has(i) ? p / mass : 0)) }
  }, [temp, topP])

  const sample = () => {
    const r = rng(seed * 101 + 7)
    const counts = TOKENS.map(() => 0)
    for (let n = 0; n < 50; n++) { let u = r(), i = 0; while (i < final.length - 1 && u > final[i]) { u -= final[i]; i++ } counts[i]++ }
    setDraws(counts); setSeed((s) => s + 1)
  }
  const entropy = -final.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0)
  const top = Math.max(...final)

  return (
    <Shell title="Temperature and top-p" intro="After 'The capital of France is', a language model scores every possible next token. These two settings decide how that list becomes a choice."
      onClose={onClose}
      note="The scores are made up to be illustrative, but the arithmetic is the real one: temperature divides the scores before the softmax, and top-p keeps the smallest set of tokens whose probabilities add up to p, then renormalizes.">
      <div className="space-y-2">
        {TOKENS.map(([t], i) => (
          <div key={t} className="flex items-center gap-2 text-sm">
            <span className="w-16 shrink-0 text-right text-muted-foreground">{t}</span>
            <div className="flex-1 relative h-4 rounded bg-muted overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-foreground/15" style={{ width: `${probs[i] * 100}%`, transition: 'width 200ms' }} />
              <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${final[i] * 100}%`, transition: 'width 200ms' }} />
            </div>
            <span className="w-24 shrink-0 text-right tabular-nums">{kept.has(i) ? `${(final[i] * 100).toFixed(1)}%` : <span className="text-muted-foreground">cut off</span>}</span>
            {draws && <span className="w-8 text-right tabular-nums text-muted-foreground">{draws[i]}</span>}
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <Slider label="Temperature" value={temp} min={0.1} max={2} step={0.05} onChange={setTemp} display={temp.toFixed(2)} />
        <Slider label="Top-p" value={topP} min={0.1} max={1} step={0.05} onChange={setTopP} display={topP.toFixed(2)} />
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button onClick={sample} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90"><Dices className="w-4 h-4" /> Draw 50 answers</button>
        <span className="text-sm text-muted-foreground tabular-nums">Top choice has {(top * 100).toFixed(0)}% of the probability, {kept.size} token{kept.size === 1 ? '' : 's'} in play{draws ? ', counts at right out of 50' : ''}</span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">
        {temp <= 0.3 ? 'Low temperature sharpens the scores: the top token takes nearly everything, so repeated runs give almost the same answer. Good for extraction and classification, but it can make writing repetitive.'
          : temp >= 1.5 ? 'High temperature flattens the scores, so unlikely tokens get real probability. Answers vary a lot, and a flat tail can include nonsense, so a top-p cut-off helps here.'
            : 'Near the default, the model mostly picks sensible tokens but still varies.'}
        {topP < 0.95 ? ` Top-p ${topP.toFixed(2)} removes the long tail, whatever the temperature: only the tokens whose probabilities first add up to ${topP.toFixed(2)} survive.` : ''}
      </p>
      <p className="text-xs text-muted-foreground">Pale bars: probability before top-p. Solid bars: after.</p>
    </Shell>
  )
}
