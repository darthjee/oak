import Kinds from '../../../assets/js/components/pages/Kinds.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('Kinds', function() {
  itRendersPageLoadingState(Kinds, 'Loading kinds...');
});
