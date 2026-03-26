# 📋 Rapport d'Architecture - Nocode Builder

**Date:** 26 Mars 2026  
**Projet:** Nocode Builder  
**Type:** Analyse complète de l'architecture modulaire

---

## 📑 Table des matières
1. [Vue d'ensemle](#vue-densemle)
2. [Analyse détaillée par module](#analyse-détaillée-par-module)
3. [Évaluation de la clarté et qualité](#évaluation-de-la-clarté-et-qualité)
4. [Recommandations](#recommandations) 

---

## 🎯 Vue d'ensemble

Le projet **Nocode Builder** est une plateforme SaaS qui permet aux utilisateurs de créer des applications sans code. L'architecture est basée sur une approche **modulaire** utilisant **FastAPI** et **SQLAlchemy** avec une base de données **PostgreSQL**.

### Structure générale
```
┌─────────────────────────────────────────────────────────┐
│                    NOCODE BUILDER                       │
├─────────────────────────────────────────────────────────┤
│  🔐 Auth      │  📦 Projects    │  🎨 Schema Builder   │
│  🔄 Generator │  📊 Data Engine │  🎬 Workflow Engine  │
│  🖼️ Interface Builder                                   │
└────────────────────────────────────────── ───────────────┘
```

### Stack technologique
- **Backend:** FastAPI (Python)
- **BDD:** PostgreSQL avec AsyncIO
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic

---

## 🔍 Analyse détaillée par module

### 1️⃣ Module **AUTH** - Authentification & Gestion des utilisateurs

#### 🎯 Responsabilités
- Gestion des comptes utilisateurs
- Authentification (login/register)
- Gestion des rôles et plans
- Génération de tokens JWT

#### 📊 Entités principales

**`User`** - Représente un utilisateur de la plateforme
```
┌─ User
├─ Identification
│  ├─ id (primary key, interne)
│  └─ tracking_id (UUID, exposé publiquement) ✅
├─ Informations personnelles
│  ├─ email (unique)
│  ├─ name, surname
│  ├─ birth_date, birth_place
│  ├─ phone, country
│  └─ hashed_password (jamais le mot de passe brut)
├─ Informations professionnelles
│  ├─ company_name
│  └─ company_size
└─ Status et permissions
   ├─ role (admin, user)
   ├─ plan (free, enterprise)
   ├─ is_active
   └─ is_verified
```

**Enums associés:**
- `UserRole`: `admin`, `user`
- `UserPlan`: `free`, `enterprise`

#### 🔌 Endpoints API
- `POST /auth/register/free` - Inscription gratuite
- `POST /auth/register/enterprise` - Inscription entreprise
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Renouveler le token
- `POST /auth/logout` - Déconnexion
- `GET /auth/me` - Profil utilisateur actuel

#### ✅ Points positifs
- Séparation claire entre `id` (interne) et `tracking_id` (exposé)
- Hash du mot de passe ✓
- Support de multiples plans d'abonnement
- Architecture service/repository bien structurée
- Validation des mots de passe

#### ⚠️ Points à améliorer
- Pas de 2FA visible (à envisager pour l'enterprise)
- Pas de refresh token rotation
- Pas de historique de logins (audit)

---

### 2️⃣ Module **PROJECTS** - Gestion des projets

#### 🎯 Responsabilités
- CRUD des projets utilisateur
- Gestion du cycle de vie (draft → published → archived)
- Configuration globale des projets (JSON)
- Gestion des permissions (owner)

#### 📊 Entités principales

**`Project`** - Un projet utilisateur
```
┌─ Project 
├─ Identification
│  ├─ id (primary key, interne)
│  ├─ tracking_id (UUID unique)
│  └─ slug (URL-friendly, unique)
├─ Description
│  ├─ name
│  └─ description
├─ État du projet
│  ├─ status (draft, published, archived)
│  └─ is_public (boolean)
├─ Configuration
│  └─ config (JSONB) - Pages, thème, composants, datasources
└─ Ownership
   ├─ owner_id (FK vers User.tracking_id)
   └─ timestamps
```

**Enums:**
- `ProjectStatus`: `draft`, `published`, `archived`

#### 🔌 Endpoints API
- `GET /projects/` - Lister mes projets
- `POST /projects/` - Créer un projet
- `GET /projects/{project_id}` - Récupérer les détails
- `PUT /projects/{project_id}` - Modifier un pro jet
- `PATCH /projects/{project_id}/status` - Changer le statut
- `DELETE /projects/{project_id}` - Supprimer un projet

#### ✅ Points positifs
- Relation claire owner → projects
- Support de la publication/archivage
- Configuration flexible en JSONB
- Slug unique pour les URLs

#### ⚠️ Points à améliorer
- Pas de partage de projets (collaborateurs)
- Pas de versioning
- Pas de restore depuis archive

---

### 3️⃣ Module **SCHEMA** - Définition des schémas de données

#### 🎯 Responsabilités
- Modéliser la structure de base de données
- Gérer les tables et les champs
- Définir les relations entre tables
- Valider les types de champs

#### 📊 Entités principales 

**`Schema`** - Schéma d'un projet
```
┌─ Schema
├─ project_id (FK vers Project)
├─ tables[] (relation 1:N avec TableSchema)
└─ timestamps
```

**`TableSchema`** - Une table de la base de données
```
┌─ TableSchema
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ schema_id (FK)
├─ Description
│  ├─ name (ex: "users", "products")
│  ├─ display_name (ex: "Utilisateurs")
│  ├─ description
│  └─ icon
├─ Relations
│  ├─ fields[] (1:N avec Field)
│  ├─ relations[] (champs sortants)
│  └─ incoming_relations[] (champs entrants)
└─ timestamps
```

**`Field`** - Un champ de table
```
┌─ Field
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ table_id (FK)
├─ Description
│  ├─ name
│  ├─ display_name
│  ├─ type (TEXT, NUMBER, BOOLEAN, DATE, EMAIL, URL, JSON)
│  └─ description
├─ Contraintes
│  ├─ required
│  ├─ unique
│  ├─ indexed
│  └─ config (JSONB) - validation personnalisée
└─ order (pour l'affichage)
```

**`Relation`** - Liens entre tables
```
┌─ Relation
├─ source_table_id (d'où)
├─ target_table_id (vers) 
├─ type (ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY)
└─ config (JSONB)
```

**Enums:**
- `FieldType`: `text`, `number`, `boolean`, `date`, `datetime`, `email`, `url`, `json`
- `RelationType`: `one_to_many`, `many_to_one`, `many_to_many`

#### 🔌 Endpoints API
- `POST /schema/{project_id}` - Créer un schéma
- `GET /schema/{project_id}` - Récupérer le schéma
- `POST /schema/tables` - Ajouter une table
- `PUT /schema/tables/{table_id}` - Modifier une table
- `POST /schema/fields` - Ajouter un champ
- `DELETE /schema/fields/{field_id}` - Supprimer un champ
- `POST /schema/relations` - Créer une relation

#### ✅ Points positifs
- Modélisation complète (tables, champs, relations)
- Types de champs variés avec validation
- Support des relations complexes (N:N)
- Configuration JSONB flexible
- Tracking unique pour chaque entité

#### ⚠️ Points à améliorer
- Pas de versioning du schéma
- Pas de migration de schéma (ce qu'on peut faire quand beaucoup de données)
- Pas de contraintes de clés étrangères visibles
- Pas de auto-increment config sur les fields

---

### 4️⃣ Module **SCHEMA_BUILDER** - Constructeur visuel de schémas

#### 🎯 Responsabilités
- Interface visuelle pour éditer les schémas
- Wrapper/abstractions du module schema

#### 📊 Entités principales
- **Réutilise les entités du module `schema`**
- Imports directs: `Schema`, `TableSchema`, `Field`, `Relation`

#### ✅ Points positifs
- DRY principle appliqué (pas de duplication)
- Coupling réduit entre les modules

#### ⚠️ Points à améliorer
- Module très léger (à enrichir avec la logique métier)
- Pas de validations métier visibles

---

### 5️⃣ Module **DATA_ENGINE** - Gestion des données de projet

#### 🎯 Responsabilités
- CRUD sur les données du projet
- Historique des modifications
- Validation contre le schéma du projet
- Audit trail des changements

#### 📊 Entités principales

**`DonneeProjet`** - Entrée de données pour une table
```
┌─ DonneeProjet
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ project_id (FK)
├─ Données
│  ├─ table_name (ex: "users", "products")
│  └─ content (JSON) - Les données réelles
├─ Audit
│  ├─ created_by (user UUID)
│  ├─ created_at
│  └─ updated_at
└─ Relation
   └─ historique[] (1:N avec HistoriqueDonnee)
```

**`HistoriqueDonnee`** - Tracking des modifications
```
┌─ HistoriqueDonnee
├─ donnee_id (FK vers DonneeProjet)
├─ ancien_contenu (JSON)
├─ nouveau_contenu (JSON)
├─ Audit
│  ├─ modifie_par (user UUID)
│  └─ modifie_le (timestamp)
└─ Ceci permet un audit trail complet
```

#### 🔌 Endpoints API
- `POST /data/projects/{project_id}/{table_name}` - Créer une donnée
- `GET /data/projects/{project_id}/{table_name}` - Récupérer les données
- `GET /data/projects/{project_id}/{table_name}/{id}` - Récupérer une entrée
- `PUT /data/projects/{project_id}/{table_name}/{id}` - Modifier une entrée
- `DELETE /data/projects/{project_id}/{table_name}/{id}` - Supprimer une entrée

#### ✅ Points positifs
- Audit trail complet avec `HistoriqueDonnee`
- Support du JSON flexible pour le contenu
- Tracking de qui a modifié quoi et quand
- Validation implicite avec le schéma

#### ⚠️ Points à améliorer
- Pas de pagination visible dans les endpoints
- Pas de soft delete (archivage logique)
- Pas de recherche/filtrage avancé
- Pas de relations avec d'autres tables respectées

---

### 6️⃣ Module **INTERFACE_BUILDER** - Constructeur visuel d'interfaces

#### 🎯 Responsabilités
- Créer l'interface utilisateur du projet généré
- Gestion des pages et des composants
- Styles et configuration des éléments UI

#### 📊 Entités principales

**`Interface`** - L'interface globale d'un projet
```
┌─ Interface
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ project_id (FK vers Project, unique)
├─ Versioning
│  └─ version (numéro de version)
├─ Relation
│  └─ pages[] (1:N avec Page)
└─ timestamps
```

**`Page`** - Une page de l'interface
```
┌─ Page
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ interface_id (FK)
├─ Description
│  ├─ nom
│  └─ chemin (route ex: "/users", "/products")
├─ Configuration
│  ├─ est_accueil (page d'accueil ?)
│  ├─ ordre
│  └─ composants[] (1:N avec Composant)
└─ created_at
```

**`Composant`** - Un composant UI dans une page
```
┌─ Composant
├─ Identification
│  ├─ tracking_id (UUID)
│  ├─ page_id (FK)
│  └─ parent_id (FK vers Composant, nullable) - Support de l'imbrication
├─ Type
│  └─ type (CONTENEUR, TEXTE, BOUTON, FORMULAIRE, CHAMP_INPUT, LISTE, CARTE, IMAGE, NAVIGATION)
├─ Positionnement
│  ├─ position_x, position_y
│  ├─ largeur (ex: "100%")
│  └─ hauteur (ex: "auto")
├─ Style et config
│  ├─ styles (JSON) - CSS/Tailwind
│  ├─ config (JSON) - Props spécifiques
│  ├─ connecte_a (string) - Connexion à une datasource?
│  └─ ordre
└─ created_at
```

**Enums:**
- `TypeComposant`: `conteneur`, `texte`, `bouton`, `formulaire`, `champ_input`, `liste`, `carte`, `image`, `navigation`

#### 🔌 Endpoints API
- `POST /interface/{project_id}` - Créer une interface
- `GET /interface/{project_id}` - Récupérer l'interface
- `POST /interface/{project_id}/pages` - Ajouter une page
- `POST /interface/{project_id}/pages/{page_id}/composants` - Ajouter un composant
- `PUT /interface/.../composants/{composant_id}` - Modifier un composant
- `DELETE /interface/.../composants/{composant_id}` - Supprimer un composant

#### ✅ Points positifs
- Support de l'imbrication des composants (parent_id)
- Modèle d'arborescence flexible
- Configuration JSON pour styles et props
- Versioning de l'interface
- Support des types de composants variés

#### ⚠️ Points à améliorer
- Pas de grid/layout system explicite
- Pas de theme management
- `connecte_a` peu clair (à documenter)
- Pas de composants réutilisables (snippets)

---

### 7️⃣ Module **GENERATOR** - Génération de code/projets

#### 🎯 Responsabilités
- Générer du code/une application basée sur le schéma et l'interface
- Gérer les statuts de génération
- Fournir les fichiers générés (ZIP)
- Tracer les erreurs de génération

#### 📊 Entités principales

**`Generation`** - Un job de génération
```
┌─ Generation
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ project_id (FK)
├─ Description
│  └─ nom (ex: "Frontend React - v2")
├─ Statut & résultat
│  ├─ statut (PENDING, IN_PROGRESS, COMPLETED, FAILED)
│  ├─ url_zip (où télécharger le résultat)
│  └─ erreur (message d'erreur si échoué)
├─ Configuration
│  └─ config (JSON) - Paramètres de génération
└─ timestamps
   ├─ created_at
   └─ completed_at (quand finalisé)
```

**Enums:**
- `StatutGeneration`: `pending`, `en_cours`, `complété`, `échoué`

#### 🔌 Endpoints API
- `POST /generator/projects/{project_id}` - Lancer une génération
- `GET /generator/projects/{project_id}/generations` - Lister les générations
- `GET /generator/{generation_id}` - Récupérer le statut
- `GET /generator/{generation_id}/download` - Télécharger le ZIP

#### ✅ Points positifs
- Statuts clairs et traçables
- Historique de toutes les générations
- Support de paramètres de génération (JSON)
- Gestion des erreurs

#### ⚠️ Points à améliorer
- Pas de log détaillé des étapes de génération
- Pas de rollback/restauration précédente génération
- Pas d'email de notification (génération complétée)
- Pas de webhook d'événement

---

### 8️⃣ Module **WORKFLOW_ENGINE** - Moteur d'automatisation

#### 🎯 Responsabilités
- Créer et gérer des workflows automatisés
- Supporter les déclencheurs, conditions, et actions
- Tracer l'exécution des workflows
- Gérer les erreurs d'exécution

#### 📊 Entités principales

**`Workflow`** - Un workflow d'automatisation
```
┌─ Workflow
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ project_id (FK)
├─ Description
│  ├─ nom
│  ├─ description
│  └─ actif (boolean)
├─ Étapes
│  └─ etapes[] (1:N EtapeWorkflow, triées par ordre)
├─ Exécutions
│  └─ executions[] (1:N ExecutionWorkflow)
└─ timestamps
```

**`EtapeWorkflow`** - Une étape du workflow
```
┌─ EtapeWorkflow
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ workflow_id (FK)
├─ Définition
│  ├─ type (DECLENCHEUR, CONDITION, ACTION)
│  ├─ ordre (position dans le workflow)
│  └─ config (JSON) - Configuration spécifique
└─ timestamps
```

**`ExecutionWorkflow`** - Une exécution d'un workflow
```
┌─ ExecutionWorkflow
├─ Identification
│  ├─ tracking_id (UUID)
│  └─ workflow_id (FK)
├─ Exécution
│  ├─ statut (EN_COURS, REUSSI, ECHEC)
│  ├─ declencheur (JSON) - Qui a déclenché?
│  ├─ resultat (JSON) - Résultat final
│  ├─ erreur (message si ECHEC)
│  └─ durée_secondes
└─ timestamps
   ├─ triggered_at
   └─ created_at
```

**Enums:**
- `TypeEtape`: `declencheur`, `condition`, `action`
- `StatutExecution`: `en_cours`, `réussi`, `échoué`

#### 🔌 Endpoints API
- `POST /workflow/projects/{project_id}` - Créer un workflow
- `GET /workflow/projects/{project_id}` - Lister les workflows
- `PUT /workflow/{workflow_id}` - Modifier un workflow
- `POST /workflow/{workflow_id}/execute` - Exécuter manuellement
- `GET /workflow/{workflow_id}/executions` - Historique d'exécution
- `DELETE /workflow/{workflow_id}` - Supprimer un workflow

#### ✅ Points positifs
- Modèle d'étapes flexible et composable
- Support des déclencheurs, conditions, actions
- Historique d'exécution complet
- Statuts d'exécution clairs
- Tracking du temps d'exécution

#### ⚠️ Points à améliorer
- Pas de retry automatique en cas d'erreur
- Pas de timeout configuré
- Pas de webhook/événement intégré
- Pas de logging détaillé par étape
- Pas de conditions complexes (et, ou, etc.)

---

## 📈 Évaluation de la clarté et qualité

### ✅ Points forts de l'architecture

1. **Architecture Modulaire Claire**
   - Chaque module a une responsabilité unique et bien définie
   - Séparation nette entre couches (models, schema, router, service, repository)
   
2. **Sécurité**
   - Séparation `id` (interne) vs `tracking_id` (exposé)
   - Hash des mots de passe
   - JWT pour l'authentification
   - Audit trail dans Data Engine

3. **Flexibilité**
   - JSONB pour configurations dynamiques
   - Enums pour les statuts et types
   - Relations polymorphes possibles

4. **Traçabilité**
   - Timestamps `created_at`, `updated_at` partout
   - `created_by`, `modifie_par` pour l'audit
   - Historique complet des modifications

5. **Structure cohérente**
   - Pattern répétitif: `router` → `service` → `repository` → `model`
   - Utilisation d'AsyncIO pour la performance
   - Dépendances injectées (Depends)

### ⚠️ Points d'amélioration

1. **Documentation**
   - Pas de docstrings dans les modèles
   - Les champs `config` (JSONB) manquent de schéma documenté
   - `connecte_a` dans Composant peu clair

2. **Relations entre modules**
   - Pas d'exemple clair de comment le Generator utilise Schema + Interface
   - Chevauchement potentiel entre SchemaBuilder et Schema

3. **Validation**
   - Pas de validation croisée visible (ex: vérifier que les relations existent)
   - Validation du JSON dans `config` manquante

4. **Performance**
   - Pas d'index explicite sur les ForeignKeys
   - Pas de cache visible (ex: pour schemas)
   - JSONB sans structure définie peut être lent

5. **Gestion des erreurs**
   - Pas d'error handlers globaux visibles
   - Pas de retry logic pour les générations

6. **Tests**
   - Pas de dossier `tests/` visible
   - Pas de fixtures/factories pour les entités

---

## 💡 Recommandations

### Court terme (Essentiel)

1. **Ajouter une couche de validation**
   ```python
   # Dans Data Engine
   - Valider le contenu JSON contre le Field type
   - Vérifier les contraintes unique, required
   - Valider les relations étrangères
   ```

2. **Documenter les schémas JSONB**
   ```python
   # Dans Project.config
   {
     "pages": [...],
     "theme": {...},
     "datasources": [...]
   }
   
   # Dans Field.config
   {
     "min_length": 0,
     "max_length": 100,
     "regex": "pattern",
     "options": []
   }
   ```

3. **Ajouter une pagination**
   ```python
   # Dans tous les GET lists
   - limit, offset parameters
   - total_count dans la réponse
   ```

4. **Créer une table de relations** si ce n'est pas fait
   - Lier explicitement Field → champs des autres tables

### Moyen terme (Important)

5. **Versioning du schéma**
   - Historique des modifications du schéma
   - Migration automatique ou warning des impacts

6. **Système de permissions**
   - Partage de projets avec collaborateurs
   - Rôles par projet (owner, editor, viewer)

7. **Webhook/Événements**
   - Trigger external services
   - Notifications (email, SMS)

8. **Tests automatisés**
   - Unit tests des services
   - Integration tests des routes

### Long terme (Nice to have)

9. **Caching**
   - Redis pour les schemas (changent rarement)
   - Cache des générations précédentes

10. **Multi-tenancy**
    - Isoler les données par tenant/organisation

11. **Analytics & Monitoring**
    - Tracking des utilisation de WorkflowEngine
    - Métriques de génération des projets

---

## 🎓 Conclusion

### Clarté: ⭐⭐⭐⭐ (4/5)
- Architecture modulaire très claire
- Chaque module a un rôle évident
- Nécessite plus de documentation des configurations JSON

### Qualité: ⭐⭐⭐⭐ (4/5)
- Bonnes pratiques de sécurité appliquées
- Audit trail et traçabilité
- Manque: validation complète, tests, pagination

### Extensibilité: ⭐⭐⭐⭐⭐ (5/5)
- Très facile d'ajouter de nouveaux modules
- Couplage faible entre modules
- Pattern répétitif et prévisible

### Recommandation globale
**L'architecture est solide et prête pour une MVP.**  
Avant la production, priorité sur:
1. ✅ Documentation des JSONs
2. ✅ Validation de données complète
3. ✅ Tests automatisés
4. ✅ Système de permissions

---

**Généré le:** 26 Mars 2026  
**Status:** ✅ Rapport complet
