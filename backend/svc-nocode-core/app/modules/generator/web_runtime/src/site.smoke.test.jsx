import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import siteConfig from './site.config.json';
import { AppRoutes } from './App';
import { SUPPORTED_SECTION_COMPONENTS } from './runtime/PageRenderer';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

describe('site.config.json — smoke test de toutes les pages', () => {
  it('rend chaque page sans erreur avec le titre de chaque section', () => {
    const pages = Array.isArray(siteConfig?.pages) ? siteConfig.pages : [];
    expect(pages.length).toBeGreaterThan(0);

    for (const page of pages) {
      const targetPath = page.path || '/';
      const html = renderToString(
        <MemoryRouter initialEntries={[targetPath]}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(html).not.toContain('Page introuvable');

      for (const section of page.sections || []) {
        const isSupported = Boolean(SUPPORTED_SECTION_COMPONENTS[section?.type]);
        const title = section?.config?.title || section?.title;
        if (title) {
          expect(html).toContain(escapeHtml(title));
        } else if (!isSupported) {
          expect(html).toContain(escapeHtml(`Section « ${section?.type || 'inconnue'} » non prise en charge dans l'export web`));
        }
      }
    }
  });
});
