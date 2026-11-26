import React from 'react';
import { Link } from 'react-router-dom';
import { asText, isInternalRoute, sanitizeStyle, sanitizeUrl } from '../safe';

export default function HeroSection({ section }) {
  const config = section?.config || {};
  const title = asText(config.title || section?.title, 'Bienvenue');
  const subtitle = asText(config.subtitle, '');
  const style = sanitizeStyle(section?.styles || config.styles);

  let ctaLabel = '';
  let ctaHref = '#';
  if (config.cta && typeof config.cta === 'object') {
    ctaLabel = asText(config.cta.label || config.cta.text, '');
    ctaHref = sanitizeUrl(config.cta.href || config.cta.path || '#');
  } else if (typeof config.cta === 'string') {
    ctaLabel = config.cta;
    ctaHref = sanitizeUrl(config.cta_href || '#');
  } else if (config.cta_text || config.button_text) {
    ctaLabel = asText(config.cta_text || config.button_text, '');
    ctaHref = sanitizeUrl(config.cta_href || '#');
  }

  return (
    <div className="rt-container">
      <section className="rt-hero" style={style}>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        {ctaLabel ? (
          isInternalRoute(ctaHref) ? (
            <Link to={ctaHref} className="rt-btn">
              {ctaLabel}
            </Link>
          ) : (
            <a href={ctaHref} className="rt-btn">
              {ctaLabel}
            </a>
          )
        ) : null}
      </section>
    </div>
  );
}
