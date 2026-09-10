import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

/** Browser entry point: mount the React application into the HTML root node. */
createRoot(document.getElementById('root')).render(<App />);
