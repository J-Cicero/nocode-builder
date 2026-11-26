import React from 'react';
import { asArray, asText, sanitizeStyle } from '../safe';

const ALLOWED_INPUT_TYPES = new Set([
  'text',
  'email',
  'number',
  'password',
  'date',
  'datetime-local',
  'url',
  'tel',
  'checkbox',
]);

export default function FormSection({ section }) {
  const config = section?.config || {};
  const title = asText(config.title || section?.title, '');
  const fields = asArray(config.fields);
  const submitLabel = asText(config.submit_label || config.button_text, 'Enregistrer');
  const style = sanitizeStyle(section?.styles || config.styles);

  return (
    <div className="rt-container">
      <section className="rt-card" style={style}>
        {title ? <h2 className="rt-section-title">{title}</h2> : null}
        <form className="rt-form" onSubmit={(e) => e.preventDefault()}>
          {fields.map((field, idx) => {
            const isObj = field && typeof field === 'object';
            const name = asText(isObj ? field.name : field, `field_${idx}`);
            const label = asText(isObj ? field.label || field.name : field, `Champ ${idx + 1}`);
            const rawType = asText(isObj ? field.type : 'text', 'text').toLowerCase();
            const inputType = ALLOWED_INPUT_TYPES.has(rawType) ? rawType : 'text';
            const placeholder = asText(isObj ? field.placeholder : '', '');
            const required = Boolean(isObj && field.required);
            const inputId = `field-${name}-${idx}`;

            return (
              <div key={idx} className="rt-field">
                <label htmlFor={inputId}>{label}</label>
                <input
                  id={inputId}
                  name={name}
                  type={inputType}
                  placeholder={placeholder}
                  required={required}
                  className="rt-input"
                  disabled
                />
              </div>
            );
          })}
          <p className="rt-notice">Ce formulaire sera connecté à l&apos;API de l&apos;application.</p>
          <div>
            <button type="submit" className="rt-btn" disabled>
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
