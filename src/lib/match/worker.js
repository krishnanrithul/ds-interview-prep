// Runs the sentence-embedding model off the main thread so typing never lags.
// The model (Xenova/all-MiniLM-L6-v2, quantized, about 23 MB) is fetched once and cached by the browser.
import { pipeline, env } from '@huggingface/transformers'
// Serve the ONNX runtime from this site instead of the jsdelivr CDN.
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'

env.allowLocalModels = false
env.backends.onnx.wasm.wasmPaths = { wasm: ortWasm, mjs: ortMjs }

let extractor = null
const getExtractor = () => (extractor ??= pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' }))

const pointCache = new Map() // question id -> key-point vectors
const sentenceCache = new Map() // sentence text -> vector (so unchanged sentences aren't re-embedded on every pause)

const embed = async (texts) => (await (await getExtractor())(texts, { pooling: 'mean', normalize: true })).tolist()
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s }

self.onmessage = async ({ data }) => {
  const { type, reqId } = data
  try {
    if (type === 'warm') {
      await getExtractor()
      self.postMessage({ type: 'ready' })
      return
    }
    if (type === 'score') {
      const { qid, points, sentences } = data
      if (!pointCache.has(qid)) pointCache.set(qid, await embed(points))
      const P = pointCache.get(qid)
      const todo = sentences.filter((s) => !sentenceCache.has(s))
      if (todo.length) (await embed(todo)).forEach((v, i) => sentenceCache.set(todo[i], v))
      if (sentenceCache.size > 500) sentenceCache.clear()
      const S = sentences.map((s) => sentenceCache.get(s))
      // Each key point is scored by the answer sentence closest to it.
      const sims = P.map((p) => (S.length ? Math.max(...S.map((s) => dot(s, p))) : 0))
      self.postMessage({ type: 'score', reqId, qid, sims })
    }
  } catch (err) {
    self.postMessage({ type: 'error', reqId, message: String(err?.message || err) })
  }
}
