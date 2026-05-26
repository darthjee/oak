import HeaderJsx from '../../../assets/js/components/elements/Header.jsx';
import HeaderJs from '../../../assets/js/components/elements/Header.js';

describe('Header (jsx re-export)', function() {
  it('re-exports the same function as the .js module', function() {
    expect(HeaderJsx).toBe(HeaderJs);
  });
});
