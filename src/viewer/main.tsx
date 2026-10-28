import { createRoot } from 'react-dom/client';
import '@/ui/styles/base.css';
import './viewer.css';
import { ViewerApp } from './ViewerApp';

createRoot(document.getElementById('root')!).render(<ViewerApp />);
