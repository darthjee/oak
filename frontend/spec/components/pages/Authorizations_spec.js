import Authorizations from '../../../assets/js/components/pages/Authorizations.jsx';
import { preserveGlobals, renderComponent, stubFetch } from '../../support/factories.js';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('Authorizations', function() {
  let restoreGlobals;

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
    stubFetch(() => new Promise(() => {}));
  });

  afterEach(function() {
    restoreGlobals();
  });

  itRendersPageLoadingState(Authorizations, 'Loading authorization requests...');

  it('does not request the list during a static render', function() {
    renderComponent(Authorizations);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
