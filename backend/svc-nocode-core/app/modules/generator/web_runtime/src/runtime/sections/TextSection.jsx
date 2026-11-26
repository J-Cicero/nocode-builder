import React from 'react';
import { asText, sanitizeStyle } from '../safe';

export default function TextSection({ section }) {
  const config = section?.config || {};
  const title = asText(config.title || section?.title, '');
  const content = asText(config.content || config.text, '');
  const style = sanitizeStyle(section?.styles || config.styles);

  return (
    <div className="rt-container">
      <section className="rt-card" style={style}>
        {title ? <h2 className="rt-section-title">{title}</h2> : null}
        {content ? <p>{content}</p> : null}
      </section>
    </div>
  );
}
