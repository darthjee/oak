import CategoryNew from '../../../assets/js/components/pages/CategoryNew.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('CategoryNew', function() {
  itRendersPageLoadingState(CategoryNew, 'Loading category new form...');
});
