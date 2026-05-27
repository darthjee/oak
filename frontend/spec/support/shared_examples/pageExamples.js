import { renderComponent } from '../factories.js';

/**
 * Shared example for page components that show a loading message on first render.
 *
 * Usage:
 *   itRendersPageLoadingState(MyPage, 'Loading my things...');
 */
export const itRendersPageLoadingState = (Component, loadingText) => {
  it('renders loading state on first render', function() {
    const html = renderComponent(Component);

    expect(html).toContain(loadingText);
  });
};
