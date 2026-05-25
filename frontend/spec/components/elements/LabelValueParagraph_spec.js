import { renderToStaticMarkup } from 'react-dom/server';
import LabelValueParagraph from '../../../assets/js/components/elements/LabelValueParagraph.jsx';

describe('LabelValueParagraph', function() {
  it('renders a paragraph with label and value', function() {
    const html = renderToStaticMarkup(
      LabelValueParagraph({
        label: 'Category',
        value: 'Project',
      })
    );

    expect(html).toContain('mb-2');
    expect(html).toContain('<strong>Category:</strong>');
    expect(html).toContain('Project');
  });
});
