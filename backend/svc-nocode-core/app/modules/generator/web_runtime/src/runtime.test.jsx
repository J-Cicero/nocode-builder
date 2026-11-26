import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PageRenderer from './runtime/PageRenderer';
import { AppRoutes } from './App';

function renderPage(page) {
  return renderToString(
    <MemoryRouter initialEntries={[page.path || '/']}>
      <PageRenderer page={page} />
    </MemoryRouter>
  );
}

describe('web_runtime — sections supportées', () => {
  it('rend chacun des 7 types web supportés', () => {
    const html = renderPage({
      name: 'Toutes',
      path: '/',
      sections: [
        {
          type: 'navbar',
          title: 'MaBarre',
          config: { title: 'MaBarre', links: [{ label: 'Accueil', path: '/' }] },
        },
        {
          type: 'hero',
          title: 'Titre Hero',
          config: {
            title: 'Titre Hero',
            subtitle: 'Sous-titre Hero',
            cta: { label: 'Démarrer', href: 'https://example.com' },
          },
        },
        {
          type: 'text-section',
          title: 'Bloc Texte',
          config: { title: 'Bloc Texte', content: 'Contenu descriptif.' },
        },
        {
          type: 'stats-row',
          title: 'KPIs',
          config: { stats: [{ label: 'Revenus', value: '1200' }] },
        },
        {
          type: 'card-grid',
          title: 'Grille Produits',
          config: { title: 'Grille Produits', table: 'products', card_fields: ['name', 'price'] },
        },
        {
          type: 'data-table',
          title: 'Tableau Clients',
          config: { title: 'Tableau Clients', table: 'clients', columns: ['nom', 'email'] },
        },
        {
          type: 'form',
          title: 'Formulaire Contact',
          config: {
            title: 'Formulaire Contact',
            fields: [{ name: 'email', label: 'Adresse email', type: 'email', required: true }],
          },
        },
      ],
    });

    expect(html).toContain('MaBarre');
    expect(html).toContain('Titre Hero');
    expect(html).toContain('Sous-titre Hero');
    expect(html).toContain('Bloc Texte');
    expect(html).toContain('Contenu descriptif.');
    expect(html).toContain('Revenus');
    expect(html).toContain('Grille Produits');
    expect(html).toContain('Tableau Clients');
    expect(html).toContain('Formulaire Contact');
    expect(html).toContain("Ce formulaire sera connecté à l&#x27;API de l&#x27;application.");
    expect(html).toContain('disabled=""');
  });
});

describe('web_runtime — sections non supportées', () => {
  it('rend UnsupportedSection pour les types mobiles et inconnus', () => {
    const html = renderPage({
      name: 'Mobile',
      path: '/mobile',
      sections: [
        { type: 'mobile-header', title: 'Entête mobile', config: { title: 'Entête mobile' } },
        { type: 'mobile-card-list', title: 'Liste mobile', config: {} },
        { type: 'bottom-nav', title: 'Nav basse', config: {} },
        { type: 'type-inconnu', title: 'Widget', config: {} },
      ],
    });

    expect(html).toContain("Section « mobile-header » non prise en charge dans l&#x27;export web");
    expect(html).toContain("Section « mobile-card-list » non prise en charge dans l&#x27;export web");
    expect(html).toContain("Section « bottom-nav » non prise en charge dans l&#x27;export web");
    expect(html).toContain("Section « type-inconnu » non prise en charge dans l&#x27;export web");
  });
});

describe('web_runtime — sécurité XSS et URLs', () => {
  it('échappe le HTML dans les titres et neutralise les liens javascript:', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const html = renderPage({
      name: 'Sec',
      path: '/sec',
      sections: [
        {
          type: 'hero',
          title: payload,
          config: {
            title: payload,
            subtitle: 'Test',
            cta: { label: 'Cliquer', href: 'javascript:alert(1)' },
          },
        },
      ],
    });

    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('javascript:alert(1)');
    expect(html).toContain('href="#"');
  });
});

describe('web_runtime — routage', () => {
  it('rend NotFound sur une route inconnue', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/route-qui-nexiste-pas']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(html).toContain('Page introuvable');
  });
});
