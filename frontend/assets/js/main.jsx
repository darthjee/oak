import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './components/App';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import '../css/styles.css';
import '../css/main.scss';

const queryClient = new QueryClient();

/** Bootstraps the React application and mounts it to the DOM root. */
export function mount() {
  createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

/* c8 ignore next */
if (typeof document !== 'undefined') {
  mount();
}
