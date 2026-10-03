import { gridXs, rmse } from './toy.js'

// Gradient boosting for squared error, written the way XGBoost scores it:
// gradient g = -(residual), hessian h = 1, leaf value = sum(residual) / (count + lambda),
// split gain = left^2/(nl+lambda) + right^2/(nr+lambda) - parent^2/(n+lambda).
// Toy version only: no column sampling, no pruning (gamma), no histogram split finding.
function fitTree(xs, rs, depth, lambda) {
  const build = (idx, d) => {
    const n = idx.length
    const sum = idx.reduce((s, i) => s + rs[i], 0)
    const leaf = { leaf: sum / (n + lambda) }
    if (d === 0 || n < 4) return leaf
    let best = null
    let left = 0
    for (let k = 0; k < n - 1; k++) {
      left += rs[idx[k]]
      if (xs[idx[k]] === xs[idx[k + 1]]) continue
      const right = sum - left
      const gain = (left * left) / (k + 1 + lambda) + (right * right) / (n - k - 1 + lambda) - (sum * sum) / (n + lambda)
      if (!best || gain > best.gain) best = { gain, k }
    }
    if (!best || best.gain <= 1e-9) return leaf
    return {
      thr: (xs[idx[best.k]] + xs[idx[best.k + 1]]) / 2,
      left: build(idx.slice(0, best.k + 1), d - 1),
      right: build(idx.slice(best.k + 1), d - 1),
    }
  }
  return build(xs.map((_, i) => i), depth)
}

const predictTree = (t, x) => (t.leaf !== undefined ? t.leaf : predictTree(x <= t.thr ? t.left : t.right, x))

// Returns, for every number of trees 0..rounds: the prediction on a grid and on the training
// points, plus training and validation error.
export function boost(train, valid, { eta = 0.3, rounds = 40, depth = 2, lambda = 1 } = {}) {
  const xs = train.map((p) => p.x)
  const ys = train.map((p) => p.y)
  const grid = gridXs()
  const base = ys.reduce((s, v) => s + v, 0) / ys.length
  let Ft = ys.map(() => base)
  let Fg = grid.map(() => base)
  let Fv = valid.map(() => base)
  const out = { grid: [], train: [], trainErr: [], validErr: [], rounds }
  const snap = () => {
    out.grid.push([...Fg])
    out.train.push([...Ft])
    out.trainErr.push(rmse(ys.map((y, i) => y - Ft[i])))
    out.validErr.push(rmse(valid.map((p, i) => p.y - Fv[i])))
  }
  snap()
  for (let k = 0; k < rounds; k++) {
    const tree = fitTree(xs, ys.map((y, i) => y - Ft[i]), depth, lambda)
    Ft = Ft.map((v, i) => v + eta * predictTree(tree, xs[i]))
    Fg = Fg.map((v, i) => v + eta * predictTree(tree, grid[i]))
    Fv = Fv.map((v, i) => v + eta * predictTree(tree, valid[i].x))
    snap()
  }
  out.best = out.validErr.indexOf(Math.min(...out.validErr))
  return out
}
