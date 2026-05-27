import { useEffect, useMemo, useState } from 'react';
import KindsController from './controllers/KindsController.js';
import KindsHelper from './helpers/KindsHelper.jsx';

/**
 * Page component that displays the paginated list of kinds.
 *
 * @returns {JSX.Element} kinds page with loading, error, or content state
 */
export default function Kinds() {
  const [kinds, setKinds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new KindsController(setKinds, setPagination, setLogged, setLoading, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return KindsHelper.renderLoading();
  }

  if (error) {
    return KindsHelper.renderError(error);
  }

  return KindsHelper.render(kinds, pagination);
}
