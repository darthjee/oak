import CategoryItems from '../../../assets/js/components/pages/CategoryItems.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('CategoryItems', function() {
  itRendersPageLoadingState(CategoryItems, 'Loading category items...');
});
