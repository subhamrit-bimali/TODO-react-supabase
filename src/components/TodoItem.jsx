import { useState } from 'react'
import styles from './TodoItem.module.css'

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' }

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.title)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    await onToggle(todo.id, todo.is_complete)
    setToggling(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(todo.id)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const trimmed = editText.trim()
    if (!trimmed || trimmed === todo.title) { setEditing(false); return }
    await onUpdate(todo.id, { title: trimmed })
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setEditText(todo.title); setEditing(false) }
  }

  const date = new Date(todo.created_at)
  const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className={`${styles.item} ${todo.is_complete ? styles.done : ''} ${deleting ? styles.deleting : ''}`}>
      {/* Animated checkbox */}
      <button
        className={`${styles.check} ${todo.is_complete ? styles.checked : ''} ${toggling ? styles.toggling : ''}`}
        onClick={handleToggle}
        aria-label={todo.is_complete ? 'Mark incomplete' : 'Mark complete'}
        disabled={toggling}
      >
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="19" height="19" rx="5.5" />
          {todo.is_complete && (
            <path
              d="M5 10.5L8.5 14L15 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="20"
              strokeDashoffset="0"
              className={styles.checkPath}
            />
          )}
        </svg>
      </button>

      {/* Content */}
      <div className={styles.content}>
        {editing ? (
          <form onSubmit={handleEditSubmit} className={styles.editForm}>
            <input
              className={styles.editInput}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEditSubmit}
              autoFocus
              maxLength={280}
            />
          </form>
        ) : (
          <span
            className={styles.title}
            onDoubleClick={() => !todo.is_complete && setEditing(true)}
            title="Double-click to edit"
          >
            {todo.title}
          </span>
        )}

        <div className={styles.meta}>
          {todo.priority && todo.priority !== 'none' && (
            <span className={`${styles.priority} ${styles[todo.priority]}`}>
              {PRIORITY_LABELS[todo.priority]}
            </span>
          )}
          <span className={styles.date}>{timeStr}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {!todo.is_complete && (
          <button
            className={styles.editBtn}
            onClick={() => setEditing(true)}
            aria-label="Edit task"
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          aria-label="Delete task"
          title="Delete"
          disabled={deleting}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
