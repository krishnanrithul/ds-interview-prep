import { Component } from 'react'

// A render error shows a message and a recovery path instead of a white screen.
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('App crashed:', error, info) }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-1">{String(this.state.error?.message || this.state.error)}</p>
          <p className="text-muted-foreground text-sm mb-6">Your progress is saved on this device. Try reloading.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">
              Reload
            </button>
            <button
              onClick={() => { localStorage.clear(); window.location.reload() }}
              className="px-5 py-2.5 rounded-xl border border-border font-semibold hover:bg-muted"
            >
              Reset all data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
