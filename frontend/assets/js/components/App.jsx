import { useState, useEffect, useMemo } from 'react';
import AppController from './AppController.js';

export default function App() {
  const [page, setPage] = useState(() => new AppController(null).getPage());

  const controller = useMemo(() => new AppController(setPage), []);

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  return controller.renderPage(page);
}
