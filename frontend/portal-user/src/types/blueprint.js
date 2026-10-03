/**
 * Types Blueprint V1
 * 
 * Source de vérité : Blueprint-Schema-V1.md
 * Implementé avec JSDoc pour un typage complet sans TypeScript.
 * 
 * Aucun usage de any, Record<string, any> ou objets non typés.
 */

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ComponentProps
 * @property {string} [label]
 * @property {string} [placeholder]
 * @property {string} [src]
 * @property {string} [alt]
 * @property {string} [href]
 * @property {string} [htmlType]
 * @property {boolean} [disabled]
 * @property {string} [value]
 */

/**
 * @typedef {Object} ComponentStyles
 * @property {string} [color]
 * @property {string} [backgroundColor]
 * @property {string} [fontSize]
 * @property {string} [fontWeight]
 * @property {string} [margin]
 * @property {string} [padding]
 * @property {string} [borderRadius]
 * @property {string} [border]
 * @property {string} [width]
 * @property {string} [height]
 * @property {string} [textAlign]
 */

/**
 * @typedef {Object} Component
 * @property {string} uuid
 * @property {'button'|'text'|'heading'|'input'|'card'|'container'|'image'} type
 * @property {ComponentProps} props
 * @property {ComponentStyles} styles
 * @property {Component[]} children
 */

// ─── Section ─────────────────────────────────────────────────────────────────

/**
 * @typedef {'hero'|'header'|'footer'|'content'|'sidebar'|'grid'|'form'} SectionType
 */

/**
 * @typedef {Object} Section
 * @property {string} uuid
 * @property {SectionType} type
 * @property {number} order
 * @property {Component[]} components
 */

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Page
 * @property {string} uuid
 * @property {string} name
 * @property {string} slug
 * @property {string} path
 * @property {string|null} icon
 * @property {Section[]} sections
 */

// ─── Theme ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ThemeColors
 * @property {string} [primary]
 * @property {string} [secondary]
 * @property {string} [background]
 * @property {string} [surface]
 * @property {string} [text]
 * @property {string} [muted]
 * @property {string} [danger]
 * @property {string} [success]
 */

/**
 * @typedef {Object} ThemeTypography
 * @property {string} [fontFamily]
 * @property {string} [fontSize]
 * @property {string} [lineHeight]
 * @property {string} [fontWeightBold]
 */

/**
 * @typedef {Object} ThemeSpacing
 * @property {string} [xs]
 * @property {string} [sm]
 * @property {string} [md]
 * @property {string} [lg]
 * @property {string} [xl]
 */

/**
 * @typedef {Object} Theme
 * @property {ThemeColors} colors
 * @property {ThemeTypography} typography
 * @property {ThemeSpacing} spacing
 * @property {Object.<string, string>} radius
 * @property {Object.<string, string>} shadow
 */

// ─── Database ─────────────────────────────────────────────────────────────────

/**
 * @typedef {'string'|'integer'|'boolean'|'date'|'datetime'|'float'|'text'|'uuid'} FieldType
 */

/**
 * @typedef {Object} DatabaseField
 * @property {string} uuid
 * @property {string} name
 * @property {FieldType} type
 * @property {boolean} required
 */

/**
 * @typedef {Object} DatabaseTable
 * @property {string} uuid
 * @property {string} name
 * @property {DatabaseField[]} fields
 */

/**
 * @typedef {Object} Database
 * @property {DatabaseTable[]} tables
 */

// ─── Workflow ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} WorkflowAction
 * @property {string} type
 * @property {Object.<string, string|number|boolean>} params
 */

/**
 * @typedef {Object} Workflow
 * @property {string} uuid
 * @property {string} name
 * @property {string} trigger
 * @property {WorkflowAction[]} actions
 */

// ─── Blueprint Content ────────────────────────────────────────────────────────

/**
 * @typedef {Object} BlueprintMetadata
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [version]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} BlueprintSettings
 * @property {string} [language]
 * @property {string} [timezone]
 * @property {boolean} [darkMode]
 */

/**
 * @typedef {Object} BlueprintContent
 * @property {BlueprintMetadata} metadata
 * @property {Page[]} pages
 * @property {Theme} theme
 * @property {Database} database
 * @property {Workflow[]} workflows
 * @property {BlueprintSettings} settings
 */

// ─── API Entities ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} BlueprintEntity
 * @property {string} uuid
 * @property {string} project_uuid
 * @property {number} version
 * @property {BlueprintContent} content
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ProjectEntity
 * @property {string} uuid
 * @property {string} workspace_uuid
 * @property {string} name
 * @property {string|null} description
 * @property {string|null} frontend_framework
 * @property {string|null} backend_framework
 * @property {'draft'|'active'|'archived'} status
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} WorkspaceEntity
 * @property {string} uuid
 * @property {string} name
 * @property {string} slug
 * @property {string} created_at
 * @property {string} updated_at
 */

// ─── Editor State ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} BlueprintContextValue
 * @property {BlueprintEntity|null} blueprint
 * @property {boolean} loading
 * @property {boolean} saving
 * @property {boolean} dirty
 * @property {string|null} error
 * @property {function(string): Promise<void>} loadBlueprint
 * @property {function(BlueprintContent): void} updateContent
 * @property {function(): Promise<void>} saveBlueprint
 * @property {function(): void} resetBlueprint
 */

/**
 * @typedef {Object} SelectionContextValue
 * @property {string|null} selectedPageId
 * @property {string|null} selectedSectionId
 * @property {string|null} selectedComponentId
 * @property {function(string): void} selectPage
 * @property {function(string): void} selectSection
 * @property {function(string): void} selectComponent
 * @property {function(): void} clearSelection
 */

export {};
