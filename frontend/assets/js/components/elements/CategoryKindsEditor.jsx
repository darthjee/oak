import React from 'react';

/**
 * Renders an editable kinds selector for category forms.
 *
 * Displays a select box with all available kinds plus an Add button, followed
 * by the list of currently selected kinds each with a Remove button.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.allKinds all available kind options
 * @param {Array<Object>} props.selectedKinds currently selected kinds
 * @param {string} props.selectedSlug slug of the currently chosen kind in the select
 * @param {Function} props.onSelectChange callback(slug) when select value changes
 * @param {Function} props.onAddKind callback() when Add button is clicked
 * @param {Function} props.onRemoveKind callback(slug) when a kind Remove button is clicked
 * @returns {JSX.Element} kinds editor section
 */
export default function CategoryKindsEditor({
  allKinds,
  selectedKinds,
  selectedSlug,
  onSelectChange,
  onAddKind,
  onRemoveKind,
}) {
  return (
    <div className='border p-3 mb-3 bg-light rounded'>
      <div className='mb-3'>
        <label className='form-label' htmlFor='category-new-kind-select'>
          Add a Kind
        </label>
        <div className='d-flex align-items-center gap-2'>
          <select
            className='form-select'
            id='category-new-kind-select'
            onChange={(e) => onSelectChange(e.target.value)}
            value={selectedSlug || ''}
          >
            <option value=''>-- Select a kind --</option>
            {allKinds.map((kind) => (
              <option key={kind.slug} value={kind.slug}>
                {kind.name}
              </option>
            ))}
          </select>
          <button className='btn btn-success' onClick={onAddKind} type='button'>
            Add
          </button>
        </div>
      </div>
      <div>
        <label className='form-label'>
          Kinds
        </label>
        <div className='d-flex flex-wrap gap-2'>
          {selectedKinds.length === 0
            ? <p className='mb-0'>No kinds selected.</p>
            : selectedKinds.map((kind) => (
              <span key={kind.slug} className='badge bg-primary d-flex align-items-center gap-1'>
                {kind.name}
                <button
                  className='btn btn-sm btn-danger ms-1'
                  onClick={() => onRemoveKind(kind.slug)}
                  type='button'
                >
                  x
                </button>
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
