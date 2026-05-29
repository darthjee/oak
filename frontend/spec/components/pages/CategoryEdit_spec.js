import CategoryEdit from '../../../assets/js/components/pages/CategoryEdit.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('CategoryEdit', function() {
  itRendersPageLoadingState(CategoryEdit, 'Loading category new form...');
});
