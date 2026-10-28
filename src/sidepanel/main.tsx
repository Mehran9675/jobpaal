import { createRoot } from 'react-dom/client';
import '@/ui/styles/base.css';
import '@/ui/companion/companion.css';
import { SidePanelApp } from './SidePanelApp';

createRoot(document.getElementById('root')!).render(<SidePanelApp />);
