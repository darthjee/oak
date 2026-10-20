import { renderToStaticMarkup } from 'react-dom/server';
import LabeledCheckbox from '../../../assets/js/components/elements/LabeledCheckbox.jsx';

describe('LabeledCheckbox', function() {
  const noop = () => {};

  it('renders the checkbox and label with bootstrap classes', function() {
    const html = renderToStaticMarkup(
      LabeledCheckbox({
        id: 'keepSignedIn',
        label: 'Keep me signed in',
        checked: false,
        onChange: noop,
      })
    );

    expect(html).toContain('Keep me signed in');
    expect(html).toContain('id="keepSignedIn"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('form-check-input');
    expect(html).toContain('form-check-label');
    expect(html).toContain('for="keepSignedIn"');
    expect(html).not.toContain('checked');
  });

  it('reflects the checked state', function() {
    const html = renderToStaticMarkup(
      LabeledCheckbox({
        id: 'keepSignedIn',
        label: 'Keep me signed in',
        checked: true,
        onChange: noop,
      })
    );

    expect(html).toContain('checked');
  });

  it('wires the change handler', function() {
    const onChange = jasmine.createSpy('onChange');
    const element = LabeledCheckbox({
      id: 'keepSignedIn',
      label: 'Keep me signed in',
      checked: false,
      onChange,
    });
    const input = element.props.children[0];
    const event = { target: { checked: true } };

    input.props.onChange(event);

    expect(onChange).toHaveBeenCalledWith(event);
  });
});
