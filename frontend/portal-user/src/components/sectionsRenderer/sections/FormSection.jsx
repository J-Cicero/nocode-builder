import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function FormSection({ section }) {
  const config = section.config || {};
  const fields = config.fields || [
    { label: "Name", type: "text", placeholder: "Your name" },
    { label: "Email", type: "email", placeholder: "your@email.com" },
    { label: "Message", type: "textarea", placeholder: "Your message" },
  ];
  const buttonText = config.buttonText || "Submit";
  const title = section.title || config.title || "Contact Form";

  return (
    <div
      style={{
        padding: "40px 32px",
        backgroundColor: COLORS.background,
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          ...baseStyles.card,
          padding: "32px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "24px",
            color: COLORS.dark,
          }}
        >
          {title}
        </h2>
        <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(Array.isArray(fields) ? fields : []).map((field, i) => {
            const fieldObj = typeof field === "object" ? field : { label: field };
            return (
              <div key={i}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: COLORS.dark,
                  }}
                >
                  {fieldObj.label || "Field"}
                </label>
                {fieldObj.type === "textarea" ? (
                  <textarea
                    placeholder={fieldObj.placeholder || ""}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: RADIUS.sm,
                      fontFamily: "inherit",
                      fontSize: "14px",
                      minHeight: "100px",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <input
                    type={fieldObj.type || "text"}
                    placeholder={fieldObj.placeholder || ""}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: RADIUS.sm,
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            );
          })}
          <button
            type="submit"
            style={{
              ...baseStyles.button,
              marginTop: "16px",
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
}
