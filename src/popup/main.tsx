import { createRoot } from 'react-dom/client';
import '@/ui/styles/base.css';
import '@/ui/companion/companion.css';
import { PopupApp } from './PopupApp';

createRoot(document.getElementById('root')!).render(<PopupApp />);
