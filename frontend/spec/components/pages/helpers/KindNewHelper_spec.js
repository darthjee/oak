import KindNewHelper from '../../../../assets/js/components/pages/helpers/KindNewHelper.jsx';
import LabeledInput from '../../../../assets/js/components/elements/LabeledInput.jsx';
import { renderStatic } from '../../../support/factories.js';
import { itRendersLoadingAndErrorStates } from '../../../support/shared_examples/pageHelperExamples.js';
import { noop } from '../../../support/noop.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('KindNewHelper', function() {
  const kind = { name: 'Code' };

  itRendersLoadingAndErrorStates(KindNewHelper, 'Loading kind new form...');

  it('renders form fields and actions', function() {
    const html = renderStatic(
      KindNewHelper.render(kind, false, noop, noop)
    );

    expect(html).toContain('/#/kinds');
    expect(html).toContain('Back');
    expect(html).toContain('Save');
    expect(html).toContain('Name');
    expect(html).toContain('Code');
  });

  it('reflects the kind name in the name input', function() {
    const element = KindNewHelper.render(kind, false, noop, noop);
    const input = findElement(element, (child) => child.type === LabeledInput);

    expect(input.props.value).toBe('Code');
  });

  it('fires onFieldChange("name", value) when the name input changes', function() {
    const onFieldChange = jasmine.createSpy('onFieldChange');
    const element = KindNewHelper.render(kind, false, onFieldChange, noop);
    const input = findElement(element, (child) => child.type === LabeledInput);

    input.props.onChange({ target: { value: 'Updated' } });

    expect(onFieldChange).toHaveBeenCalledWith('name', 'Updated');
  });

  it('disables the Save button while saving', function() {
    const html = renderStatic(
      KindNewHelper.render(kind, true, noop, noop)
    );

    expect(html).toContain('disabled');
    expect(html).toContain('Saving...');
  });

  it('enables the Save button and shows Save when not saving', function() {
    const html = renderStatic(
      KindNewHelper.render(kind, false, noop, noop)
    );

    expect(html).not.toContain('disabled');
    expect(html).toContain('>Save<');
  });
});
