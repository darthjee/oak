import { useState, useEffect, useMemo } from 'react';
import Header from './elements/Header.jsx';
import Categories from './pages/Categories.jsx';
import AppController from './AppController.js';

export default function App() {
  const [page, setPage] = useState(() => new AppController(null).getPage());

  const controller = useMemo(() => new AppController(setPage), []);

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  return (
    <>
      <Header />
      {page === 'categories' && <Categories />}
      {page === 'home' && <p>placeholder</p>}
    </>
  );
}
