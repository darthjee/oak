import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CategoryItemLinksEditor from '../../../assets/js/components/elements/CategoryItemLinksEditor.jsx';

describe('CategoryItemLinksEditor', function() {
  it('renders editable rows and action buttons', function() {
    const html = renderToStaticMarkup(
      <CategoryItemLinksEditor
        links={[{ id: 1, text: 'GitHub', url: 'https://github.com/darthjee/oak' }]}
        onAddLink={() => {}}
        onLinkChange={() => {}}
        onRemoveLink={() => {}}
      />
    );

    expect(html).toContain('Links');
    expect(html).toContain('Text');
    expect(html).toContain('URL');
    expect(html).toContain('Remove');
    expect(html).toContain('Add link');
    expect(html).toContain('https://github.com/darthjee/oak');
  });
});
