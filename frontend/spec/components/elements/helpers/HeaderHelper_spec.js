import { renderToStaticMarkup } from 'react-dom/server';
import HeaderHelper from '../../../../assets/js/components/elements/helpers/HeaderHelper.js';
import LoginModal from '../../../../assets/js/components/elements/LoginModal.jsx';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('HeaderHelper', function() {
  const buildHandlers = (overrides = {}) => ({
    onLogoff: jasmine.createSpy('onLogoff'),
    onLoginClick: jasmine.createSpy('onLoginClick'),
    onCloseModal: jasmine.createSpy('onCloseModal'),
    onAuthSuccess: jasmine.createSpy('onAuthSuccess'),
    showModal: false,
    ...overrides,
  });

  it('renders loading state', function() {
    const html = renderToStaticMarkup(HeaderHelper.renderLoading());

    expect(html).toContain('Oak');
    expect(html).toContain('Loading navigation...');
    expect(html).toContain('Categories');
  });

  it('renders error state', function() {
    const html = renderToStaticMarkup(HeaderHelper.renderError('network failure'));

    expect(html).toContain('Navigation unavailable: network failure');
  });

  it('renders logged out menu', function() {
    const html = renderToStaticMarkup(HeaderHelper.render(false, [], buildHandlers()));

    expect(html).toContain('Categories');
    expect(html).toContain('All');
    expect(html).toContain('Login');
    expect(html).not.toContain('Logoff');
    expect(html).not.toContain('>/#/categories/new<');
  });

  it('renders logged in menu with subscribed categories', function() {
    const html = renderToStaticMarkup(
      HeaderHelper.render(
        true,
        [{ slug: 'electronics', name: 'Electronics' }],
        buildHandlers()
      )
    );

    expect(html).toContain('New');
    expect(html).toContain('Logoff');
    expect(html).toContain('/#/categories/electronics/items');
    expect(html).toContain('Electronics');
  });

  it('wires the login link and login modal props', function() {
    const handlers = buildHandlers({ showModal: true });
    const element = HeaderHelper.render(false, [], handlers);
    const loginLink = findElement(
      element,
      (child) => child.type === 'a' && child.props.children === 'Login'
    );
    const modal = findElement(element, (child) => child.type === LoginModal);
    const preventDefault = jasmine.createSpy('preventDefault');

    loginLink.props.onClick({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(handlers.onLoginClick).toHaveBeenCalled();
    expect(modal.props.show).toBe(true);
    expect(modal.props.onClose).toBe(handlers.onCloseModal);
    expect(modal.props.onSuccess).toBe(handlers.onAuthSuccess);
  });

  it('wires the logoff action when logged in', function() {
    const handlers = buildHandlers();
    const element = HeaderHelper.render(true, [], handlers);
    const logoffLink = findElement(
      element,
      (child) => child.type === 'a' && child.props.children === 'Logoff'
    );

    logoffLink.props.onClick();

    expect(handlers.onLogoff).toHaveBeenCalled();
  });
});
