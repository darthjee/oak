import Kind from '../../../assets/js/components/pages/Kind.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('Kind', function() {
  itRendersPageLoadingState(Kind, 'Loading kind...');
});
