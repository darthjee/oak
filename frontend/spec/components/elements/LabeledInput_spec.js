import { renderToStaticMarkup } from 'react-dom/server';
import LabeledInput from '../../../assets/js/components/elements/LabeledInput.jsx';

describe('LabeledInput', function() {
  it('renders the label and input with default classes', function() {
    const html = renderToStaticMarkup(
      LabeledInput({
        id: 'login',
        label: 'Username',
        type: 'text',
        value: 'oak',
        readOnly: true,
      })
    );

    expect(html).toContain('Username');
    expect(html).toContain('id="login"');
    expect(html).toContain('type="text"');
    expect(html).toContain('value="oak"');
    expect(html).toContain('form-control');
    expect(html).toContain('mb-3');
  });

  it('passes through extra input props', function() {
    const html = renderToStaticMarkup(
      LabeledInput({
        id: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Secret',
        autoComplete: 'current-password',
      })
    );

    expect(html).toContain('placeholder="Secret"');
    expect(html).toContain('autoComplete="current-password"');
  });
});
