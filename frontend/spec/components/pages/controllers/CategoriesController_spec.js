import CategoriesController from '../../../../assets/js/components/pages/controllers/CategoriesController.js';
import { itBehavesLikeAPaginatedController } from '../../../support/shared_examples/paginatedControllerExamples.js';

describe('CategoriesController', function() {
  itBehavesLikeAPaginatedController({
    buildController: (spies, client) => new CategoriesController(
      spies.setPrimary, spies.setPagination, spies.setLogged, spies.setLoading, spies.setError,
      client
    ),
    endpoint: '/categories.json',
    sampleData: [{ slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' }],
    loadingErrorMsg: 'Unable to load categories.',
    unexpectedErrorMsg: 'Unexpected error while loading categories.',
  });
});
