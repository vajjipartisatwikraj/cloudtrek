import { useEffect, useState } from 'react';
import { api } from './api';

const empty = { title: '', body: '' };

/**
 * Notes workspace for the authenticated user.
 * This component owns loading, creating, editing, and deleting notes; the API
 * wrapper supplies authentication and keeps transport details out of the UI.
 */
export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  /** Refresh the list after any mutation so the UI reflects server state. */
  const load = () => api('/notes').then(setNotes).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  /** Create a note or update the note currently selected for editing. */
  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api(`/notes/${editingId}`, { method: 'PUT', body: form });
      else await api('/notes', { method: 'POST', body: form });
      setForm(empty);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  /** Delete a note and clear the editor if it was the active note. */
  async function remove(id) {
    await api(`/notes/${id}`, { method: 'DELETE' });
    if (editingId === id) { setEditingId(null); setForm(empty); }
    load();
  }

  return (
    <>
      <form className="card" onSubmit={save}>
        <h2>{editingId ? 'Edit note' : 'New note'}</h2>

        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <label htmlFor="body">Body</label>
        <textarea
          id="body"
          rows={3}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        {error && <p role="alert" className="error">{error}</p>}

        <div className="row">
          <button type="submit">{editingId ? 'Update' : 'Add note'}</button>
          {editingId && (
            <button type="button" className="link" onClick={() => { setEditingId(null); setForm(empty); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {notes.length === 0 && <p className="muted">No notes yet.</p>}

      <ul className="notes">
        {notes.map((n) => (
          <li key={n.id} className="card">
            <h3>{n.title}</h3>
            {n.body && <p>{n.body}</p>}
            <div className="row">
              <button onClick={() => { setEditingId(n.id); setForm({ title: n.title, body: n.body }); }}>
                Edit
              </button>
              <button className="danger" onClick={() => remove(n.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
