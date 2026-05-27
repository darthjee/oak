import KindsController from '../../../../assets/js/components/pages/controllers/KindsController.js';
import { preserveGlobals } from '../../../support/factories.js';
import { itBehavesLikeAPaginatedController } from '../../../support/shared_examples/paginatedControllerExamples.js';

describe('KindsController', function() {
  let restoreGlobals;

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
  });

  afterEach(function() {
    restoreGlobals();
  });

  itBehavesLikeAPaginatedController({
    buildController: (spies, client) => new KindsController(
      spies.setPrimary, spies.setPagination, spies.setLogged, spies.setLoading, spies.setError,
      client
    ),
    endpoint: '/kinds.json',
    sampleData: [{ slug: 'book', name: 'Book', snap_url: 'http://example.com/book.png' }],
    loadingErrorMsg: 'Unable to load kinds.',
    unexpectedErrorMsg: 'Unexpected error while loading kinds.',
  });
});
