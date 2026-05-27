import Categories from '../../../assets/js/components/pages/Categories.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('Categories', function() {
  itRendersPageLoadingState(Categories, 'Loading categories...');
});
