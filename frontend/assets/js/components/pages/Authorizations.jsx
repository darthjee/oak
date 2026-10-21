import { useEffect, useMemo, useState } from 'react';
import AuthorizationsController from './controllers/AuthorizationsController.js';
import AuthorizationsHelper from './helpers/AuthorizationsHelper.jsx';

/**
 * Page component listing the current user's open device authorization requests,
 * letting them authorize (with password) or deny each one.
 *
 * @returns {JSX.Element} authorizations page with loading, error, or content state
 */
export default function Authorizations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState({});

  const controller = useMemo(
    () => new AuthorizationsController(setRequests, setLoading, setError, setRows),
    []
  );

  const handlers = useMemo(() => ({
    onRefresh: () => controller.refresh(),
    onDeny: (uuid) => controller.deny(uuid),
    onOpenAuthorize: (uuid) => controller.openAuthorize(uuid),
    onCancelAuthorize: (uuid) => controller.closeAuthorize(uuid),
    onPasswordChange: (uuid, value) => controller.setPassword(uuid, value),
    onConfirm: (uuid) => controller.authorize(uuid),
  }), [controller]);

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return AuthorizationsHelper.renderLoading();
  }

  return AuthorizationsHelper.render({
    requests,
    error,
    rows,
    now: new Date(),
    handlers,
  });
}
