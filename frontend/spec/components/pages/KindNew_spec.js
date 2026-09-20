import KindNew from '../../../assets/js/components/pages/KindNew.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('KindNew', function() {
  itRendersPageLoadingState(KindNew, 'Loading kind new form...');
});
