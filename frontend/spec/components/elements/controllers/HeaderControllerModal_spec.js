import HeaderController from '../../../../assets/js/components/elements/controllers/HeaderController.js';
import { setLoggedIn } from '../../../../assets/js/utils/authState.js';
import LoginModalEvents from '../../../../assets/js/utils/LoginModalEvents.js';
import { buildSpies, preserveGlobals } from '../../../support/factories.js';

describe('HeaderController#buildModalEffect', function() {
  let restoreWindow;
  let setShowModal;
  let setModalMode;
  let controller;
  let cleanup;

  beforeEach(function() {
    restoreWindow = preserveGlobals('window');
    global.window = new EventTarget();

    const { setLogged, setCategories, setLoading, setError } = buildSpies(
      'setLogged',
      'setCategories',
      'setLoading',
      'setError'
    );

    ({ setShowModal, setModalMode } = buildSpies('setShowModal', 'setModalMode'));
    controller = new HeaderController(
      setLogged,
      setCategories,
      setLoading,
      setError,
      setShowModal,
      setModalMode
    );
    cleanup = controller.buildModalEffect()();
  });

  afterEach(function() {
    cleanup();
    restoreWindow();
    setLoggedIn(false);
  });

  it('shows the modal with the requested mode when logged out', function() {
    LoginModalEvents.open('device');

    expect(setModalMode).toHaveBeenCalledWith('device');
    expect(setShowModal).toHaveBeenCalledWith(true);
  });

  it('ignores open requests while logged in', function() {
    setLoggedIn(true);

    LoginModalEvents.open('device');

    expect(setModalMode).not.toHaveBeenCalled();
    expect(setShowModal).not.toHaveBeenCalledWith(true);
  });

  it('hides the modal on close', function() {
    LoginModalEvents.close();

    expect(setShowModal).toHaveBeenCalledWith(false);
  });

  it('stops listening after cleanup', function() {
    cleanup();

    LoginModalEvents.open('password');
    LoginModalEvents.close();

    expect(setShowModal).not.toHaveBeenCalled();
    expect(setModalMode).not.toHaveBeenCalled();
  });
});
