import React from 'react';
import PageRenderer from '../runtime/PageRenderer';
import siteConfig from '../site.config.json';

export default function DetailsPage() {
  return <PageRenderer page={siteConfig.pages[1]} />;
}
