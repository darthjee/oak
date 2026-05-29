import { renderToStaticMarkup } from 'react-dom/server';
import CategoryKindsEditorList from '../../../assets/js/components/elements/CategoryKindsEditorList.jsx';

describe('CategoryKindsEditorList', function() {
  it('renders selected kinds as removable badges', function() {
    const html = renderToStaticMarkup(
      CategoryKindsEditorList({
        kinds: [{ slug: 'code', name: 'Code' }, { slug: 'hardware', name: 'Hardware' }],
        onRemoveKind: () => {},
      })
    );

    expect(html).toContain('Kinds');
    expect(html).toContain('Code');
    expect(html).toContain('Hardware');
    expect(html).toContain('badge');
  });

  it('renders empty message when no kinds are selected', function() {
    const html = renderToStaticMarkup(
      CategoryKindsEditorList({ kinds: [], onRemoveKind: () => {} })
    );

    expect(html).toContain('No kinds selected.');
    expect(html).not.toContain('badge');
  });
});
