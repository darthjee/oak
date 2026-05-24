import React from 'react';
import Pagination from '../../elements/Pagination.js';

export default class CategoriesHelper {
  static renderLoading() {
    return (
      <div className='container mt-4'>
        <p className='text-muted'>Loading categories...</p>
      </div>
    );
  }

  static renderError(error) {
    return (
      <div className='container mt-4'>
        <div className='alert alert-danger'>{`Error: ${error}`}</div>
      </div>
    );
  }

  static render(categories, logged, pagination) {
    const page = pagination?.page ?? 1;
    const pages = pagination?.pages ?? 1;
    const perPage = pagination?.perPage ?? 10;

    return (
      <div className='container mt-4'>
        {logged && (
          <a className='btn btn-primary mb-3' href='/#/categories/new'>
            New
          </a>
        )}
        <div className='row'>
          {categories.map((category) => this.#renderCard(category))}
        </div>
        <Pagination
          currentPage={page}
          totalPages={pages}
          perPage={perPage}
          basePath='/#/categories'
        />
      </div>
    );
  }

  static #renderCard(category) {
    const { slug, name, snap_url: snapUrl } = category;

    return (
      <div key={slug} className='col-sm-6 col-md-4 col-lg-3 mb-4'>
        <div className='card h-100'>
          <a href={`/#/categories/${slug}/items`} className='text-decoration-none text-dark'>
            <div className='card-body'>
              <h5 className='card-title'>{name}</h5>
              {snapUrl && (
                <img
                  src={snapUrl}
                  alt={name}
                  className='img-fluid'
                />
              )}
            </div>
          </a>
        </div>
      </div>
    );
  }
}
