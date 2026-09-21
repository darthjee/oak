import CategoryItemNew from '../../../assets/js/components/pages/CategoryItemNew.jsx';
import CategoryItemEditHelper from '../../../assets/js/components/pages/helpers/CategoryItemEditHelper.jsx';
import { renderStatic } from '../../support/factories.js';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('CategoryItemNew', function() {
  itRendersPageLoadingState(CategoryItemNew, 'Loading category item edit...');

  it('hides the upload section when the item has no id yet', function() {
    const item = {
      name: '',
      description: '',
      kind_slug: '',
      category: { slug: 'project', name: 'Project' },
      links: [],
    };
    const noop = () => {};
    const html = renderStatic(
      CategoryItemEditHelper.render(item, {
        kinds: [],
        saving: false,
        onFieldChange: noop,
        onLinkChange: noop,
        onRemoveLink: noop,
        onAddLink: noop,
        onSave: noop,
        cancelHref: '/#/categories/project/items',
      })
    );

    expect(html).not.toContain('type="file"');
    expect(html).not.toContain('Upload');
  });
});
