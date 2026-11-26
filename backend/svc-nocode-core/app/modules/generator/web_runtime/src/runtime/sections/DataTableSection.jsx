import React from 'react';
import { asArray, asText, sanitizeStyle } from '../safe';

export default function DataTableSection({ section }) {
  const config = section?.config || {};
  const title = asText(config.title || section?.title, '');
  const columns = asArray(config.columns);
  const rows = asArray(config.rows);
  const tableName = asText(config.table || section?.connected_to, '');
  const style = sanitizeStyle(section?.styles || config.styles);

  const normalizedCols = columns.map((col, idx) => {
    if (col && typeof col === 'object') {
      return {
        key: asText(col.key || col.name, `col_${idx}`),
        label: asText(col.label || col.name || col.key, `Colonne ${idx + 1}`),
      };
    }
    const label = asText(col, `Colonne ${idx + 1}`);
    return { key: label, label };
  });

  return (
    <div className="rt-container">
      <section className="rt-card" style={style}>
        {title ? <h2 className="rt-section-title">{title}</h2> : null}
        <div className="rt-table-wrap">
          <table className="rt-table">
            <thead>
              <tr>
                {normalizedCols.map((col, idx) => (
                  <th key={idx}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {normalizedCols.map((col, cIdx) => (
                      <td key={cIdx}>
                        {row && typeof row === 'object' ? asText(row[col.key], '—') : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(normalizedCols.length, 1)} className="rt-muted">
                    {tableName
                      ? `Tableau lié à la table « ${tableName} » (aucune donnée chargée en mode statique).`
                      : 'Aucune donnée chargée en mode statique.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
