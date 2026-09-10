import { useState } from 'react';
import Auth from './Auth';
import Notes from './Notes';
import { getToken, clearToken } from './api';

/**
 * Root UI controller. Authentication is intentionally represented as a small
 * state switch rather than a router because this app has only two views.
 */
export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));

  return (
    <main>
      <header className="row">
        <h1>Notes Saver</h1>
        {loggedIn && (
          <button className="link" onClick={() => { clearToken(); setLoggedIn(false); }}>
            Log out
          </button>
        )}
      </header>

      {loggedIn ? <Notes /> : <Auth onLogin={() => setLoggedIn(true)} />}
    </main>
  );
}
