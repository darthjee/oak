import { useEffect, useMemo, useState } from 'react';
import KindController from './controllers/KindController.js';
import KindHelper from './helpers/KindHelper.jsx';

/**
 * Page component that displays a kind details page.
 *
 * @returns {JSX.Element} kind page with loading, error, or content state
 */
export default function Kind() {
  const [kind, setKind] = useState(null);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new KindController(setKind, setLogged, setLoading, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return KindHelper.renderLoading();
  }

  if (error) {
    return KindHelper.renderError(error);
  }

  return KindHelper.render(kind, logged);
}
