import CategoryNewHelper from '../../../../assets/js/components/pages/helpers/CategoryNewHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import { itRendersLoadingAndErrorStates } from '../../../support/shared_examples/pageHelperExamples.js';

describe('CategoryNewHelper', function() {
  const category = {
    name: 'My Category',
    kinds: [{ slug: 'code', name: 'Code' }],
    kind_slug: '',
  };
  const allKinds = [
    { slug: 'code', name: 'Code' },
    { slug: 'hardware', name: 'Hardware' },
  ];

  itRendersLoadingAndErrorStates(CategoryNewHelper, 'Loading category new form...');

  it('renders form fields and actions', function() {
    const html = renderStatic(
      CategoryNewHelper.render(
        category,
        allKinds,
        false,
        () => {},
        () => {},
        () => {},
        () => {}
      )
    );

    expect(html).toContain('/#/categories');
    expect(html).toContain('Back');
    expect(html).toContain('Save');
    expect(html).toContain('Name');
    expect(html).toContain('My Category');
    expect(html).toContain('Add a Kind');
    expect(html).toContain('Code');
    expect(html).toContain('Hardware');
  });

  it('renders selected kinds with remove buttons', function() {
    const html = renderStatic(
      CategoryNewHelper.render(
        category,
        allKinds,
        false,
        () => {},
        () => {},
        () => {},
        () => {}
      )
    );

    expect(html).toContain('Code');
    expect(html).toContain('badge');
  });

  it('renders empty kinds message when no kinds are selected', function() {
    const html = renderStatic(
      CategoryNewHelper.render(
        { ...category, kinds: [] },
        allKinds,
        false,
        () => {},
        () => {},
        () => {},
        () => {}
      )
    );

    expect(html).toContain('No kinds selected.');
  });

  it('shows Saving... and disables button when saving', function() {
    const html = renderStatic(
      CategoryNewHelper.render(
        category,
        allKinds,
        true,
        () => {},
        () => {},
        () => {},
        () => {}
      )
    );

    expect(html).toContain('Saving...');
    expect(html).toContain('disabled');
  });
});
