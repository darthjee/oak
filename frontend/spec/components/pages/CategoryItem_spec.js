import CategoryItem from '../../../assets/js/components/pages/CategoryItem.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('CategoryItem', function() {
  itRendersPageLoadingState(CategoryItem, 'Loading category item...');
});
