import CategoryItemNew from '../../../assets/js/components/pages/CategoryItemNew.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('CategoryItemNew', function() {
  itRendersPageLoadingState(CategoryItemNew, 'Loading category item edit...');
});
