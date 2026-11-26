import React from 'react';
import { Link } from 'react-router-dom';
import { asArray, asText, isInternalRoute, sanitizeStyle, sanitizeUrl } from '../safe';

export default function NavbarSection({ section }) {
  const config = section?.config || {};
  const title = asText(config.title || section?.title, 'Application');
  const links = asArray(config.links);
  const style = sanitizeStyle(section?.styles || config.styles);

  return (
    <nav className="rt-navbar" style={style}>
      <Link to="/" className="rt-navbar-brand">
        {title}
      </Link>
      <div className="rt-navbar-links">
        {links.map((item, idx) => {
          const isObj = item && typeof item === 'object';
          const label = asText(isObj ? item.label || item.title || item.path : item, `Lien ${idx + 1}`);
          const rawHref = isObj ? item.path || item.href || '#' : '#';
          const safeHref = sanitizeUrl(rawHref);

          if (isInternalRoute(safeHref)) {
            return (
              <Link key={idx} to={safeHref} className="rt-navbar-link">
                {label}
              </Link>
            );
          }
          return (
            <a key={idx} href={safeHref} className="rt-navbar-link">
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
