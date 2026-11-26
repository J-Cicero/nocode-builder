import React from 'react';
import { asArray, asText, sanitizeStyle } from '../safe';

export default function CardGridSection({ section }) {
  const config = section?.config || {};
  const title = asText(config.title || section?.title, '');
  const cards = asArray(config.cards);
  const cardFields = asArray(config.card_fields);
  const tableName = asText(config.table || section?.connected_to, '');
  const style = sanitizeStyle(section?.styles || config.styles);

  return (
    <div className="rt-container">
      <section style={style}>
        {title ? <h2 className="rt-section-title">{title}</h2> : null}
        {cards.length > 0 ? (
          <div className="rt-cards-grid">
            {cards.map((card, idx) => {
              const isObj = card && typeof card === 'object';
              const cardTitle = asText(isObj ? card.title || card.name : card, `Élément ${idx + 1}`);
              const description = isObj ? asText(card.description || card.subtitle, '') : '';
              return (
                <article key={idx} className="rt-card">
                  <h3>{cardTitle}</h3>
                  {description ? <p className="rt-muted">{description}</p> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rt-card">
            <p className="rt-muted">
              {tableName
                ? `Grille de cartes liée à la table « ${tableName} » (mode statique).`
                : 'Grille de cartes en mode statique.'}
            </p>
            {cardFields.length > 0 ? (
              <div className="rt-cards-grid">
                {cardFields.map((fieldName, idx) => (
                  <div key={idx} className="rt-stat-card">
                    <div className="rt-stat-label">{asText(fieldName, `Champ ${idx + 1}`)}</div>
                    <div className="rt-muted">—</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
