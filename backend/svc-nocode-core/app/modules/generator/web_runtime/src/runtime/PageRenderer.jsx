import React from 'react';
import { asArray } from './safe';
import UnsupportedSection from './UnsupportedSection';
import NavbarSection from './sections/NavbarSection';
import HeroSection from './sections/HeroSection';
import TextSection from './sections/TextSection';
import StatsRowSection from './sections/StatsRowSection';
import CardGridSection from './sections/CardGridSection';
import DataTableSection from './sections/DataTableSection';
import FormSection from './sections/FormSection';

export const SUPPORTED_SECTION_COMPONENTS = {
  navbar: NavbarSection,
  hero: HeroSection,
  'text-section': TextSection,
  'stats-row': StatsRowSection,
  'card-grid': CardGridSection,
  'data-table': DataTableSection,
  form: FormSection,
};

export default function PageRenderer({ page }) {
  const sections = asArray(page?.sections);

  return (
    <main className="rt-page" data-page-path={page?.path || '/'}>
      {sections.map((section, idx) => {
        const Component = SUPPORTED_SECTION_COMPONENTS[section?.type];
        if (!Component) {
          return <UnsupportedSection key={idx} section={section} />;
        }
        return <Component key={idx} section={section} />;
      })}
    </main>
  );
}
