import React from 'react';
import CatalogCard from './CatalogCard.jsx';
import CategoryItemLinks from './CategoryItemLinks.jsx';

/**
 * Renders a category item card with footer links.
 *
 * @param {{href: string, title: string, imageSrc?: string, links?: Array<Object>}} props card attributes
 * @returns {JSX.Element} card markup
 */
export default function CategoryItemCard({ href, title, imageSrc, links = [] }) {
  return (
    <CatalogCard
      href={href}
      title={title}
      imageSrc={imageSrc}
      footer={<CategoryItemLinks links={links} />}
    />
  );
}
