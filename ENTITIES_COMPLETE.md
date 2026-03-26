# 📊 Inventaire Complet des Entités - NoCode Builder

**Date:** 26 Mars 2026  
**Version:** 1.0  
**Status:** ✅ Documenté

---

## 📑 Table des matières

1. [🔐 Module AUTH](#-module-auth)
2. [📦 Module PROJECTS](#-module-projects)
3. [🎨 Module SCHEMA](#-module-schema)
4. [📊 Module DATA_ENGINE](#-module-data_engine)
5. [🖼️ Module INTERFACE_BUILDER](#-module-interface_builder)
6. [🔄 Module GENERATOR](#-module-generator)
7. [🎬 Module WORKFLOW_ENGINE](#-module-workflow_engine)alembic revision --autogenerate -m "add ai conversations"
alembic upgrade head
uvicorn app.main:app --reload
8. [🤖 Module AI](#-module-ai)

---

# 🔐 Module AUTH

**Chemin:** `app/modules/auth/`  
**Responsabilité:** Gestion des utilisateurs et authentification

## Entité: `User`
**Table:** `users`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public exposé |
| `email` | String(255) | unique, NOT NULL, index | Email de l'utilisateur |
| `name` | String(100) | NOT NULL | Prénom |
| `surname` | String(100) | NOT NULL | Nom de famille |
| `birth_place` | String(150) | nullable | Lieu de naissance |
| `birth_date` | Date | nullable | Date de naissance |
| `country` | String(100) | nullable | Pays |
| `phone` | String(20) | nullable | Numéro de téléphone |
| `hashed_password` | String(255) | NOT NULL | Mot de passe hashé |
| `role` | Enum | default=USER | `admin` ou `user` |
| `plan` | Enum | nullable | `free` ou `enterprise` |
| `company_name` | String(200) | nullable | Nom de l'entreprise |
| `company_size` | String(50) | nullable | Taille de l'entreprise |
| `is_active` | Boolean | default=True | Compte actif |
| `is_verified` | Boolean | default=False | Email vérifié |
| `created_at` | DateTime | server_default | Date de création |
| `updated_at` | DateTime | onupdate | Date de modification |

**Enums:**
- `UserRole`: `admin`, `ualembic revision --autogenerate -m "add ai conversations"
alembic upgrade head
uvicorn app.main:app --reloadser`
- `UserPlan`: `free`, `enterprise`

**Relations:**
- ← `Project.owner_id` (1:N inverse)

---

# 📦 Module PROJECTS

**Chemin:** `app/modules/projects/`  
**Responsabilité:** Gestion des projets utilisateur

## Entité: `Project`
**Table:** `projects`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `name` | String(200) | NOT NULL | Nom du projet |
| `description` | Text | nullable | Description |
| `slug` | String(200) | unique, NOT NULL, index | URL-friendly name |
| `status` | Enum | default=DRAFT | `draft`, `published`, `archived` |
| `is_public` | Boolean | default=False | Projet public |
| `config` | JSONB | default={} | Configuration (pages, thème, datasources) |
| `owner_id` | UUID | FK→users.tracking_id | Propriétaire du projet |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Enums:**
- `ProjectStatus`: `draft`, `published`, `archived`

**Relations:**
- → `User.projects` (N:1)
- ← `Schema.project` (1:1)
- ← `Interface.project` (1:1 implicite)
- ← `Workflow.workflows` (1:N)
- ← `Conversation.conversations` (1:1)
- ← `Generation.generations` (1:N)
- ← `DonneeProjet.donnees` (1:N)

---

# 🎨 Module SCHEMA

**Chemin:** `app/modules/schema/`  
**Responsabilité:** Modélisation de la structure de base de données

## Entité: `Schema`
**Table:** `schemas`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `project_id` | UUID | FK→projects.tracking_id, unique | Schéma par projet |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Relations:**
- → `Project.schema` (N:1)
- ← `TableSchema.table_schemas` (1:N, cascade)

---

## Entité: `TableSchema`
**Table:** `tables_schema`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `schema_id` | UUID | FK→schemas.tracking_id | Parent schema |
| `name` | String(100) | NOT NULL | Nom technique (snake_case) |
| `display_name` | String(200) | nullable | Nom d'affichage |
| `description` | Text | nullable | Description |
| `icon` | String(10) | nullable | Emoji ou icon |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Relations:**
- → `Schema.tables` (N:1)
- ← `Field.fields` (1:N, cascade)
- ← `Relation.source_table` (1:N source, cascade)
- ← `Relation.target_table` (1:N target)

---

## Entité: `Field`
**Table:** `fields`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `table_id` | UUID | FK→tables_schema.tracking_id | Table parent |
| `name` | String(100) | NOT NULL | Nom technique (snake_case) |
| `display_name` | String(200) | nullable | Nom d'affichage |
| `type` | Enum | default=TEXT | Type: text, number, boolean, date, datetime, email, url, json |
| `description` | Text | nullable | Description |
| `required` | Boolean | default=False | Champ obligatoire |
| `unique` | Boolean | default=False | Valeur unique |
| `indexed` | Boolean | default=False | Indexé en BD |
| `config` | JSONB | default={} | Config additionnelle (min_length, max_length, regex, options) |
| `order` | Integer | default=0 | Ordre d'affichage |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Enums:**
- `FieldType`: `text`, `number`, `boolean`, `date`, `datetime`, `email`, `url`, `json`

**Relations:**
- → `TableSchema.fields` (N:1)

---

## Entité: `Relation`
**Table:** `relations`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `schema_id` | UUID | FK→schemas.tracking_id | Schema parent |
| `source_table_id` | UUID | FK→tables_schema.tracking_id | Table source |
| `target_table_id` | UUID | FK→tables_schema.tracking_id | Table cible |
| `name` | String(100) | NOT NULL | Nom de la relation |
| `type` | Enum | default=ONE_TO_MANY | `one_to_many`, `many_to_one`, `many_to_many` |
| `description` | Text | nullable | Description |
| `source_key` | String(100) | default="id" | Clé source |
| `target_key` | String(100) | default="id" | Clé cible |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Enums:**
- `RelationType`: `one_to_many`, `many_to_one`, `many_to_many`

**Relations:**
- → `TableSchema.source_table` (N:1)
- → `TableSchema.target_table` (N:1)

---

# 📊 Module DATA_ENGINE

**Chemin:** `app/modules/data_engine/`  
**Responsabilité:** Gestion et historique des données du projet

## Entité: `DonneeProjet`
**Table:** `donnees_projets`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `project_id` | UUID | FK→projects.tracking_id, index | Projet propriétaire |
| `table_name` | String(100) | NOT NULL | Nom de la table cible |
| `content` | JSON | NOT NULL | Données JSON |
| `created_by` | UUID | nullable | Créé par (user tracking_id) |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Relations:**
- ← `HistoriqueDonnee.historique` (1:N, cascade)

---

## Entité: `HistoriqueDonnee`
**Table:** `historique_donnees`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `donnee_id` | UUID | FK→donnees_projets.tracking_id | Donnée modifiée |
| `ancien_contenu` | JSON | NOT NULL | Contenu avant modification |
| `nouveau_contenu` | JSON | NOT NULL | Contenu après modification |
| `modifie_par` | UUID | nullable | Modifié par (user tracking_id) |
| `modifie_le` | DateTime | server_default | Date de modification |

**Relations:**
- → `DonneeProjet.historique` (N:1)

---

# 🖼️ Module INTERFACE_BUILDER

**Chemin:** `app/modules/interface_builder/`  
**Responsabilité:** Construction visuelle des interfaces utilisateur

## Entité: `Interface`
**Table:** `interfaces`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `project_id` | UUID | FK→projects.tracking_id, unique | Une interface par projet |
| `version` | Integer | default=1 | Numéro de version |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Relations:**
- ← `Page.pages` (1:N, cascade)

---

## Entité: `Page`
**Table:** `pages`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `interface_id` | UUID | FK→interfaces.tracking_id | Interface parent |
| `nom` | String(200) | NOT NULL | Nom de la page |
| `chemin` | String(200) | NOT NULL | Route (ex: "/users", "/dashboard") |
| `est_accueil` | Boolean | default=False | Page d'accueil |
| `ordre` | Integer | default=0 | Ordre dans le menu |
| `created_at` | DateTime | server_default | Date création |

**Relations:**
- → `Interface.pages` (N:1)
- ← `Composant.composants` (1:N, cascade)

---

## Entité: `Composant`
**Table:** `composants`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `page_id` | UUID | FK→pages.tracking_id | Page parent |
| `parent_id` | UUID | FK→composants.tracking_id, nullable | Composant parent (imbrication) |
| `type` | Enum | NOT NULL | Type: conteneur, texte, bouton, formulaire, champ_input, liste, carte, image, navigation |
| `position_x` | Integer | default=0 | Position X (px) |
| `position_y` | Integer | default=0 | Position Y (px) |
| `largeur` | String(100) | default="100%" | Largeur (px ou %) |
| `hauteur` | String(100) | default="auto" | Hauteur (px ou auto) |
| `styles` | JSON | nullable | CSS/Tailwind styles |
| `config` | JSON | nullable | Props spécifiques au composant |
| `connecte_a` | String(200) | nullable | Connexion datasource |
| `ordre` | Integer | default=0 | Ordre dans le parent |
| `created_at` | DateTime | server_default | Date création |

**Enums:**
- `TypeComposant`: `conteneur`, `texte`, `bouton`, `formulaire`, `champ_input`, `liste`, `carte`, `image`, `navigation`

**Relations:**
- → `Page.composants` (N:1)
- → `Composant.parent` (N:1 auto-ref)
- ← `Composant.enfants` (1:N auto-ref)

---

# 🔄 Module GENERATOR

**Chemin:** `app/modules/generator/`  
**Responsabilité:** Génération de code/projets exportables

## Entité: `Generation`
**Table:** `generations`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `project_id` | UUID | FK (index) | Projet générée |
| `nom` | String(200) | NOT NULL | Nom du job (ex: "Frontend React v2") |
| `statut` | Enum | default=PENDING | `pending`, `en_cours`, `complété`, `échoué` |
| `url_zip` | String(500) | nullable | URL pour télécharger le ZIP |
| `erreur` | String(500) | nullable | Message d'erreur si échoué |
| `config` | JSON | nullable | Paramètres de génération |
| `created_at` | DateTime | server_default | Date création |
| `completed_at` | DateTime | nullable | Date d'achèvement |

**Enums:**
- `StatutGeneration`: `pending`, `en_cours`, `complété`, `échoué`

**Relations:**
- Aucune relation SQLAlchemy (simples FK)

---

# 🎬 Module WORKFLOW_ENGINE

**Chemin:** `app/modules/workflow_engine/`  
**Responsabilité:** Automatisation et workflows

## Entité: `Workflow`
**Table:** `workflows`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `project_id` | UUID | FK→projects.tracking_id | Projet propriétaire |
| `nom` | String(200) | NOT NULL | Nom du workflow |
| `description` | String(500) | nullable | Description |
| `actif` | Boolean | default=True | Workflow actif |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Relations:**
- ← `EtapeWorkflow.etapes` (1:N, ordered, cascade)
- ← `ExecutionWorkflow.executions` (1:N, cascade)

---

## Entité: `EtapeWorkflow`
**Table:** `etapes_workflow`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `workflow_id` | UUID | FK→workflows.tracking_id | Workflow parent |
| `ordre` | Integer | NOT NULL | Ordre d'exécution |
| `type` | Enum | NOT NULL | `declencheur`, `condition`, `action` |
| `config` | JSON | NOT NULL | Configuration de l'étape |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Enums:**
- `TypeEtape`: `declencheur`, `condition`, `action`

**Relations:**
- → `Workflow.etapes` (N:1)

---

## Entité: `ExecutionWorkflow`
**Table:** `executions_workflow`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `workflow_id` | UUID | FK→workflows.tracking_id | Workflow exécuté |
| `statut` | Enum | default=EN_COURS | `en_cours`, `réussi`, `échoué` |
| `declencheur` | JSON | nullable | Données du déclencheur |
| `resultat` | JSON | nullable | Résultat de l'exécution |
| `erreur` | String(500) | nullable | Message d'erreur si échoué |
| `durée_secondes` | Float | nullable | Temps d'exécution |
| `triggered_at` | DateTime | server_default | Date déclenchement |
| `created_at` | DateTime | server_default | Date création |

**Enums:**
- `StatutExecution`: `en_cours`, `réussi`, `échoué`

**Relations:**
- → `Workflow.executions` (N:1)

---

# 🤖 Module AI

**Chemin:** `app/modules/ai/`  
**Responsabilité:** Chat IA et génération automatique de schémas

## Entité: `Conversation`
**Table:** `conversations`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `project_id` | UUID | FK→projects.tracking_id, unique | Une conversation par projet |
| `title` | String(200) | default="Project Assistant" | Titre de la conversation |
| `created_at` | DateTime | server_default | Date création |
| `updated_at` | DateTime | onupdate | Date modification |

**Relations:**
- ← `Message.messages` (1:N, ordered, cascade)

---

## Entité: `Message`
**Table:** `messages`

| Attribut | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | Integer | PK, index | Clé primaire interne |
| `tracking_id` | UUID | unique, index | Identifiant public |
| `conversation_id` | UUID | FK→conversations.tracking_id | Conversation parent |
| `role` | Enum | NOT NULL | `user` ou `assistant` |
| `content` | Text | NOT NULL | Contenu du message |
| `created_at` | DateTime | server_default | Date création |

**Enums:**
- `MessageRole`: `user`, `assistant`

**Relations:**
- → `Conversation.messages` (N:1)

---

## 📊 Diagramme des Relations

```
┌─────────────┐
│    User     │ (tracking_id: UUID)
└──────┬──────┘
       │ owns
       │
       ▼
┌─────────────────┐
│   Project       │ (tracking_id: UUID)
├─────────────────┤
│ • owner_id ────→ User.tracking_id
└──┬──┬──┬──┬────────┬────────────────────────┬──────────────┐
   │  │  │  │        │                        │              │
   │  │  │  │    1:1 │                    1:1 │          1:N │
   ▼  ▼  ▼  ▼        ▼                        ▼              ▼
┌──────┐ ┌────────┐ ┌───────────┐ ┌─────────────┐ ┌──────────────┐
│Schema│ │Workflow│ │ Conversation│  │ Interface   │ │  Generation  │
└──┬───┘ │        │ │(chatbot)    │  │             │ │              │
   │     └────────┘ │             │  └─────────────┘ └──────────────┘
   │                └──┬──────────┘
   │                   │1:N
   │1:N                ▼
   │            ┌──────────────┐
   ▼            │   Message    │
┌──────────┐    │              │
│TableSchema│└──────────────┘
│   (table)|
├──────────┤
│ • schema_id ──→ Schema.tracking_id
└────┬─────┘
     │1:N
     ├─────→ Field
     │
     └─────→ Relation
              (source/target → TableSchema)

┌─────────────────────────────────────────┐
│        Interface (1 per project)        │
├─────────────────────────────────────────┤
│      • project_id → Project.tracking_id  │
└──────────────────┬──────────────────────┘
                   │1:N
                   ▼
            ┌──────────┐
            │   Page   │
            └────┬─────┘
                 │1:N
                 ▼
         ┌────────────────┐
         │  Composant     │ (recursive: parent_id → Composant)
         └────────────────┘

┌─────────────────────────────┐
│    Data Engine              │
├─────────────────────────────┤
│                             │
│  ┌────────────────┐         │
│  │ DonneeProjet   │         │
│  │ • project_id ──→ Project │
│  │ • table_name   │ (reference│
│  │ • content      │ implite) │
│  └────┬───────────┘         │
│       │1:N (audit trail)    │
│       │                     │
│       ▼                     │
│  ┌────────────────┐         │
│  │HistoriqueDonnée│         │
│  │ (versioning)   │         │
│  └────────────────┘         │
└─────────────────────────────┘

┌──────────────────────────┐
│    Workflow Engine       │
├──────────────────────────┤
│                          │
│  ┌────────────────┐      │
│  │   Workflow     │      │
│  └────┬───────────┘      │
│       │1:N               │
│       ├──→ EtapeWorkflow │
│       │    (ordered)     │
│       │                  │
│       └──→ ExecutionWF   │
│           (history)      │
└──────────────────────────┘
```

---

## 📈 Statistiques

| Catégorie | Count |
|-----------|-------|
| **Modules** | 8 |
| **Entités (Tables)** | 20 |
| **Enums** | 15 |
| **Relations** | ~30+ |
| **Champs Totaux** | ~200+ |

---

## 🔗 Dépendances Clés

### Cascade Delete
- `Project` → (supprime) `Schema`, `Interface`, `Workflow`, `Conversation`, `Generation`, `DonneeProjet`
- `Schema` → (supprime) `TableSchema`
- `TableSchema` → (supprime) `Field`, `Relation`
- `Conversation` → (supprime) `Message`
- `Workflow` → (supprime) `EtapeWorkflow`, `ExecutionWorkflow`
- `Page` → (supprime) `Composant`
- `DonneeProjet` → (supprime) `HistoriqueDonnee`

### UUID Tracking
- Toutes les entités publiques exposent `tracking_id` (UUID)
- Les IDs entiers (`id`) sont strictement internes
- Les ForeignKeys référencent `tracking_id`, pas `id`

### Unicité
| Entité | Champ Unique |
|--------|--------------|
| `User` | email, tracking_id |
| `Project` | slug, tracking_id |
| `Schema` | project_id (1:1) |
| `Interface` | project_id (1:1) |
| `Conversation` | project_id (1:1) |
| Tous | tracking_id |

---

**Généré le:** 26 Mars 2026  
**Status:** ✅ Complet et à jour
