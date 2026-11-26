import React from 'react';
import { asArray, asText, sanitizeStyle } from '../safe';

export default function StatsRowSection({ section }) {
  const config = section?.config || {};
  const title = asText(config.title || section?.title, '');
  const stats = asArray(config.stats);
  const style = sanitizeStyle(section?.styles || config.styles);

  return (
    <div className="rt-container">
      <section style={style}>
        {title ? <h2 className="rt-section-title">{title}</h2> : null}
        <div className="rt-stats-grid">
          {stats.map((stat, idx) => {
            const isObj = stat && typeof stat === 'object';
            const label = asText(isObj ? stat.label : stat, `Indicateur ${idx + 1}`);
            const value = isObj && stat.value !== undefined && stat.value !== null ? asText(stat.value, '—') : '—';
            const table = isObj ? asText(stat.table, '') : '';
            return (
              <div key={idx} className="rt-stat-card">
                <div className="rt-stat-label">{label}</div>
                <div className="rt-stat-value">{value}</div>
                {table ? <div className="rt-muted">Source : {table}</div> : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
