import { useEffect, useMemo, useState } from 'react';
import PhotoMigrationController, {
  buildEmptyTotals,
} from './controllers/PhotoMigrationController.js';
import PhotoMigrationHelper from './helpers/PhotoMigrationHelper.jsx';

/**
 * Page component that migrates the logged-in user's legacy photos in a request loop.
 *
 * @returns {JSX.Element} logged-out message or the migration page
 */
export default function PhotoMigration() {
  const [logged, setLogged] = useState(false);
  const [status, setStatus] = useState('idle');
  const [totals, setTotals] = useState(buildEmptyTotals);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new PhotoMigrationController(setLogged, setStatus, setTotals, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (!logged) {
    return PhotoMigrationHelper.renderLoggedOut();
  }

  return PhotoMigrationHelper.render(status, totals, error, {
    onStart: () => controller.start(),
    onStop: () => controller.stop(),
  });
}
