import { useState, useEffect } from 'react';
import Header from './elements/Header.jsx';
import Categories from './pages/Categories.jsx';

function getPage() {
  const hash = window.location.hash;

  if (hash === '#/categories' || hash === '#/categories/') {
    return 'categories';
  }

  return 'home';
}

export default function App() {
  const [page, setPage] = useState(getPage());

  useEffect(() => {
    const handleHashChange = () => setPage(getPage());

    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <>
      <Header />
      {page === 'categories' && <Categories />}
      {page === 'home' && <p>placeholder</p>}
    </>
  );
}
