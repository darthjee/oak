import KindEdit from '../../../assets/js/components/pages/KindEdit.jsx';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

describe('KindEdit', function() {
  itRendersPageLoadingState(KindEdit, 'Loading kind new form...');
});
