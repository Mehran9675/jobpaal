import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/ui/styles/base.css';
import '@/ui/components/extras.css';
import '@/ui/editors/editors.css';
import './styles/options.css';
import { App } from './App';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
