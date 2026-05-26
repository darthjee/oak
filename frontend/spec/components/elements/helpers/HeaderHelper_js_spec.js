import HeaderHelperJs from '../../../../assets/js/components/elements/helpers/HeaderHelper.js';
import HeaderHelperJsx from '../../../../assets/js/components/elements/helpers/HeaderHelper.jsx';

describe('HeaderHelper (js re-export)', function() {
  it('re-exports the same class as the .jsx module', function() {
    expect(HeaderHelperJs).toBe(HeaderHelperJsx);
  });
});
