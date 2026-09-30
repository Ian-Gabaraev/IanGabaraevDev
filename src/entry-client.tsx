import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { PreloadContext, readPreload } from './lib/preload';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

const tree = (
  <StrictMode>
    <PreloadContext.Provider value={readPreload()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PreloadContext.Provider>
  </StrictMode>
);

// Production HTML is prerendered, so hydrate it. `npm run dev` serves a shell
// whose only child is the `<!--app-html-->` placeholder comment, which needs a
// plain client render instead — hence the element (not node) check.
if (container.firstElementChild) {
  hydrateRoot(container, tree);
} else {
  container.replaceChildren();
  createRoot(container).render(tree);
}
