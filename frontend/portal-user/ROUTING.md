# 🛣️ Application Routing

**Configuration**: React Router v6 (Production-ready)  
**Authentication**: localStorage-based  
**Status**: ✅ Complete & Ready

---

## Quick Overview

### Routes Déclarées (19)

| Type | Route | Component | Auth Required |
|------|-------|-----------|---|
| **PUBLIC** | `/` | LandingPage | ❌ |
| | `/features` | FeaturesPage | ❌ |
| | `/pricing` | PricingPage | ❌ |
| | `/templates` | TemplatesPage | ❌ |
| | `/use-cases` | UseCasesPage | ❌ |
| | `/blog` | BlogPage | ❌ |
| | `/about` | AboutPage | ❌ |
| **AUTH** | `/auth/login` | LoginPage | ❌ |
| | `/auth/signup` | SignupPage | ❌ |
| | `/auth/register/personal` | RegisterPersonalPage | ❌ |
| | `/auth/register/enterprise` | RegisterEnterprisePage | ❌ |
| **PROTECTED** | `/app/dashboard` | DashboardPage | ✅ |
| | `/app/editor/:projectId` | EditorPage | ✅ |
| | `/app/data/:projectId` | DataPage | ✅ |
| | `/app/preview/:projectId` | PreviewPage | ✅ |
| | `/app/settings` | SettingsPage | ✅ |
| | `/app/upgrade` | UpgradePage | ✅ |

---

## Key Files

### `src/router.jsx`
Central routing configuration with BrowserRouter wrapper.

### `src/components/auth/PrivateRoute.jsx`
Route protection component that checks `localStorage.getItem('authToken')`.

### `src/App.jsx`
Updated to use `<AppRouter />` instead of static component.

---

## Authentication Flow

1. User logs in at `/auth/login`
2. On success: `localStorage.setItem('authToken', token)`
3. Navigate to `/app/dashboard`
4. PrivateRoute checks token on protected routes
5. If no token: Redirect to `/auth/login`

---

## Usage Examples

### Navigation
```javascript
import { useNavigate, Link } from 'react-router-dom';

// Programmatic
const navigate = useNavigate();
navigate('/app/dashboard');

// Declarative
<Link to="/pricing">Pricing</Link>
```

### Get Route Parameters
```javascript
import { useParams } from 'react-router-dom';

const { projectId } = useParams();
```

---

## See Also
- Design tokens: `DESIGN_TOKEN_SUMMARY.md`
- Detailed routing guide: Session-state `ROUTING_SETUP.md`
