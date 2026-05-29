import Category from '../../../assets/js/components/pages/Category.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('Category', function() {
  itRendersPageLoadingState(Category, 'Loading category...');
});
