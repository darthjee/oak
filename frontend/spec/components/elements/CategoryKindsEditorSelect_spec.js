import { renderToStaticMarkup } from 'react-dom/server';
import CategoryKindsEditorSelect from '../../../assets/js/components/elements/CategoryKindsEditorSelect.jsx';

describe('CategoryKindsEditorSelect', function() {
  const kinds = [{ slug: 'code', name: 'Code' }, { slug: 'hardware', name: 'Hardware' }];

  it('renders a select with all available kinds', function() {
    const html = renderToStaticMarkup(
      CategoryKindsEditorSelect({
        kinds,
        selectedSlug: '',
        onSelectChange: () => {},
        onAddKind: () => {},
      })
    );

    expect(html).toContain('Add a Kind');
    expect(html).toContain('Code');
    expect(html).toContain('Hardware');
    expect(html).toContain('Select a kind');
  });

  it('renders an Add button', function() {
    const html = renderToStaticMarkup(
      CategoryKindsEditorSelect({
        kinds,
        selectedSlug: '',
        onSelectChange: () => {},
        onAddKind: () => {},
      })
    );

    expect(html).toContain('Add');
    expect(html).toContain('btn-success');
  });
});
