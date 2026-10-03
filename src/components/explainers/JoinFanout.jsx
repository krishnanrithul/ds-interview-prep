import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Shell, { Seg } from './Shell.jsx'

const ORDERS = [{ id: 'A101', amount: 100 }, { id: 'A102', amount: 200 }, { id: 'A103', amount: 150 }]
const money = (v) => `$${v.toLocaleString()}`

export default function JoinFanout({ onClose }) {
  const [counts, setCounts] = useState({ A101: 1, A102: 2, A103: 1 })
  const [kind, setKind] = useState('inner')
  const bump = (id, d) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(4, c[id] + d)) }))

  const rows = []
  for (const o of ORDERS) {
    const n = counts[o.id]
    if (n === 0 && kind === 'left') rows.push({ ...o, pay: null })
    for (let i = 0; i < n; i++) rows.push({ ...o, pay: i + 1 })
  }
  const naive = rows.reduce((s, r) => s + r.amount, 0)
  const truth = ORDERS.reduce((s, o) => s + o.amount, 0)
  const distinct = new Set(rows.map((r) => r.id)).size
  const fanned = rows.length > distinct
  const missing = ORDERS.length - distinct

  let caption
  if (naive === truth) caption = 'Every order has exactly one payment, so the join keeps one row per order and the sum matches. This is the case where the mistake hides: the query works until some order gets a second payment.'
  else {
    const parts = []
    if (fanned) parts.push('Orders with more than one payment appear once per payment, so their amount is counted again each time')
    if (missing > 0 && kind === 'inner') parts.push(`${missing} order${missing > 1 ? 's' : ''} with no payments disappeared from an inner join`)
    caption = `${parts.join(', and ')}. The sum is off by ${money(Math.abs(naive - truth))}. The cause is the grain of the join: one order matches many payment rows, so the result has the grain of payments, not orders.`
  }

  return (
    <Shell title="Join fan-out: why the total changed" intro="Join orders to payments, then sum the order amount. Change how many payments each order has and see what the sum does."
      onClose={onClose}
      note="A three-row example. In the joined table, the order amount is repeated on each payment row; that repetition is what inflates the sum.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm font-semibold mb-1">Orders (amount) and their payments</div>
          <div className="rounded-xl border border-border divide-y divide-border">
            {ORDERS.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span><span className="font-medium">{o.id}</span> <span className="text-muted-foreground tabular-nums">{money(o.amount)}</span></span>
                <span className="inline-flex items-center gap-2">
                  <button onClick={() => bump(o.id, -1)} aria-label={`Fewer payments for ${o.id}`} className="p-1 rounded-lg border border-border hover:bg-muted"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="tabular-nums w-24 text-center">{counts[o.id]} payment{counts[o.id] === 1 ? '' : 's'}</span>
                  <button onClick={() => bump(o.id, 1)} aria-label={`More payments for ${o.id}`} className="p-1 rounded-lg border border-border hover:bg-muted"><Plus className="w-3.5 h-3.5" /></button>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3"><Seg label="Join type" value={kind} onChange={setKind} options={[{ id: 'inner', label: 'Inner join' }, { id: 'left', label: 'Left join' }]} /></div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-1">Result of the join</div>
          <div className="rounded-xl border border-border text-sm overflow-hidden">
            <div className="grid grid-cols-3 bg-muted px-3 py-1.5 font-medium"><span>order</span><span>amount</span><span>payment</span></div>
            {rows.length === 0 && <div className="px-3 py-2 text-muted-foreground">No rows</div>}
            {rows.map((r, i) => (
              <div key={i} className={`grid grid-cols-3 px-3 py-1.5 border-t border-border tabular-nums ${r.pay > 1 ? 'bg-amber-100/60 dark:bg-amber-400/10' : ''}`}>
                <span>{r.id}</span><span>{money(r.amount)}</span><span>{r.pay ? `#${r.pay}` : 'NULL'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mt-4 text-sm">
        <div className={`rounded-xl border p-3 ${naive === truth ? 'border-border' : 'border-rose-500/60'}`}><div className="text-muted-foreground">SUM(amount) after the join</div><div className="text-2xl tabular-nums font-semibold">{money(naive)}</div></div>
        <div className="rounded-xl border border-border p-3"><div className="text-muted-foreground">SUM(amount) from orders alone</div><div className="text-2xl tabular-nums font-semibold">{money(truth)}</div></div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">{caption}</p>
      <p className="text-[15px] leading-relaxed">Ways out: sum the amounts before joining, collapse payments to one row per order first, or count each order once with a distinct key. Checking that the row count after a join matches what you expect is the cheapest guard.</p>
    </Shell>
  )
}
