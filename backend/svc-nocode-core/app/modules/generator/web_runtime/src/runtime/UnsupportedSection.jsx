import React from 'react';
import { asText } from './safe';

export default function UnsupportedSection({ section }) {
  const secType = asText(section?.type, 'inconnue');
  const title = asText(section?.title || section?.config?.title, '');

  return (
    <div className="rt-container">
      <div className="rt-unsupported" role="note" data-section-type={secType}>
        <strong>{`Section « ${secType} » non prise en charge dans l'export web`}</strong>
        {title ? <p className="rt-muted">{title}</p> : null}
      </div>
    </div>
  );
}
