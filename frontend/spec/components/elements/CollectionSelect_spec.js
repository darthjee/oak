import { renderToStaticMarkup } from 'react-dom/server';
import CollectionSelect from '../../../assets/js/components/elements/CollectionSelect.jsx';
import { noop } from '../../support/noop.js';

describe('CollectionSelect', function() {
  const collection = [
    { slug: 'code', name: 'Code' },
    { slug: 'hardware', name: 'Hardware' },
  ];

  it('renders options from the collection using keyColumn and labelColumn', function() {
    const html = renderToStaticMarkup(
      CollectionSelect({
        collection,
        keyColumn: 'slug',
        labelColumn: 'name',
        selectedValue: '',
        onChange: noop,
      })
    );

    expect(html).toContain('value="code"');
    expect(html).toContain('Code');
    expect(html).toContain('value="hardware"');
    expect(html).toContain('Hardware');
    expect(html).toContain('form-select');
  });

  it('renders the placeholder as the default empty option', function() {
    const html = renderToStaticMarkup(
      CollectionSelect({
        collection,
        keyColumn: 'slug',
        labelColumn: 'name',
        selectedValue: '',
        onChange: noop,
        placeholder: '-- Pick one --',
      })
    );

    expect(html).toContain('-- Pick one --');
    expect(html).toContain('value=""');
  });

  it('applies the default placeholder when none is provided', function() {
    const html = renderToStaticMarkup(
      CollectionSelect({
        collection,
        keyColumn: 'slug',
        labelColumn: 'name',
        selectedValue: '',
        onChange: noop,
      })
    );

    expect(html).toContain('-- Select --');
  });

  it('marks the selected option', function() {
    const html = renderToStaticMarkup(
      CollectionSelect({
        collection,
        keyColumn: 'slug',
        labelColumn: 'name',
        selectedValue: 'hardware',
        onChange: noop,
      })
    );

    expect(html).toContain('value="hardware"');
  });

  it('uses the provided id and className', function() {
    const html = renderToStaticMarkup(
      CollectionSelect({
        collection,
        keyColumn: 'slug',
        labelColumn: 'name',
        selectedValue: '',
        onChange: noop,
        id: 'my-select',
        className: 'custom-class',
      })
    );

    expect(html).toContain('id="my-select"');
    expect(html).toContain('custom-class');
  });
});
