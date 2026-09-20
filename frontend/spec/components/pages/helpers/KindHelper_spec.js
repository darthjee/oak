import KindHelper from '../../../../assets/js/components/pages/helpers/KindHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import { itRendersLoadingAndErrorStates } from '../../../support/shared_examples/pageHelperExamples.js';

describe('KindHelper', function() {
  const kind = {
    slug: 'code',
    name: 'Code',
    snap_url: 'http://example.com/code.png',
  };

  itRendersLoadingAndErrorStates(KindHelper, 'Loading kind...');

  it('renders actions and kind data', function() {
    const html = renderStatic(KindHelper.render(kind, false));

    expect(html).toContain('/#/kinds');
    expect(html).not.toContain('/#/kinds/code/edit');
    expect(html).toContain('Back');
    expect(html).toContain('Code');
    expect(html).toContain('http://example.com/code.png');
    expect(html).not.toContain('Items');
  });

  it('renders edit action when user is logged in', function() {
    const html = renderStatic(KindHelper.render(kind, true));

    expect(html).toContain('/#/kinds/code/edit');
    expect(html).toContain('Edit');
  });
});
