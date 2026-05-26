import HeaderControllerJsx from '../../../../assets/js/components/elements/controllers/HeaderController.jsx';
import HeaderControllerJs from '../../../../assets/js/components/elements/controllers/HeaderController.js';

describe('HeaderController (jsx re-export)', function() {
  it('re-exports the same class as the .js module', function() {
    expect(HeaderControllerJsx).toBe(HeaderControllerJs);
  });
});
