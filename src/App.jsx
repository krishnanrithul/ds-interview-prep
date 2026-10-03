import { useState, useEffect } from 'react'
import questions from './data/questions.json'
import './App.css'

function App() {
  const [filter, setFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  const [studied, setStudied] = useState({})

  // Load studied from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studied')
    if (saved) {
      setStudied(JSON.parse(saved))
    }
  }, [])

  // Save studied to localStorage on change
  useEffect(() => {
    localStorage.setItem('studied', JSON.stringify(studied))
  }, [studied])

  const toggleStudied = (id) => {
    setStudied(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const topics = ['all', ...new Set(questions.questions.map(q => q.topic))]

  const filtered = questions.questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(filter.toLowerCase())
    const matchesTopic = topicFilter === 'all' || q.topic === topicFilter
    return matchesSearch && matchesTopic
  })

  return (
    <div className="app">
      <header className="header">
        <h1>DS Interview Prep</h1>
        <p>Real follow-up chains from someone who hires senior DS engineers</p>
      </header>

      <div className="container">
        <aside className="sidebar">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search questions..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Topic</label>
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <p className="count">
            {filtered.length} of {questions.questions.length} questions
          </p>
        </aside>

        <main className="questions-list">
          {filtered.length === 0 ? (
            <p className="no-results">No questions match your filters</p>
          ) : (
            filtered.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                studied={studied[q.id]}
                toggleStudied={toggleStudied}
              />
            ))
          )}
        </main>
      </div>
    </div>
  )
}

function QuestionCard({ question, studied, toggleStudied }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="question-card">
      <div className="question-header" onClick={() => setExpanded(!expanded)}>
        <div className="question-content">
          <h3>{question.question}</h3>
          <p className="meta">
            {question.topic} · {question.difficulty} · {question.frequency}
          </p>
        </div>
        <button
          className={`study-btn ${studied ? 'studied' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            toggleStudied(question.id)
          }}
        >
          {studied ? '✓' : '○'}
        </button>
      </div>

      {expanded && (
        <div className="question-details">
          <div className="follow-ups">
            <strong>Follow-ups:</strong>
            {question.follow_ups.map((fu, idx) => (
              <p key={idx} className="follow-up">
                <strong>{idx + 1}.</strong> {fu.text}
                <br />
                <em>→ {fu.intent}</em>
              </p>
            ))}
          </div>
          <div className="insight">
            <strong>Key insight:</strong> {question.key_insight}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
