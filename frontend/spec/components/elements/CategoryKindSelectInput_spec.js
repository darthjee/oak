import { renderToStaticMarkup } from 'react-dom/server';
import CategoryKindSelectInput from '../../../assets/js/components/elements/CategoryKindSelectInput.jsx';

describe('CategoryKindSelectInput', function() {
  const kinds = [{ slug: 'code', name: 'Code' }, { slug: 'hardware', name: 'Hardware' }];

  it('renders a select with all available kinds', function() {
    const html = renderToStaticMarkup(
      CategoryKindSelectInput({
        kinds,
        selectedSlug: '',
        onSelectChange: () => {},
        onAddKind: () => {},
      })
    );

    expect(html).toContain('Code');
    expect(html).toContain('Hardware');
    expect(html).toContain('Select a kind');
    expect(html).toContain('form-select');
  });

  it('renders an Add button', function() {
    const html = renderToStaticMarkup(
      CategoryKindSelectInput({
        kinds,
        selectedSlug: '',
        onSelectChange: () => {},
        onAddKind: () => {},
      })
    );

    expect(html).toContain('Add');
    expect(html).toContain('btn-success');
  });

  it('marks the selected option', function() {
    const html = renderToStaticMarkup(
      CategoryKindSelectInput({
        kinds,
        selectedSlug: 'code',
        onSelectChange: () => {},
        onAddKind: () => {},
      })
    );

    expect(html).toContain('value="code"');
  });
});
