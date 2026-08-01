# RestroMind AI — Frontend

The React 18 + Vite client for RestroMind AI — a digital menu & restaurant management platform.

## 🚀 Tech Stack

| Technology | Role |
|-----------|------|
| **React 18** | UI framework |
| **Vite** | Build tool + HMR dev server |
| **React Router DOM v6** | Client-side routing + protected routes |
| **Axios** | HTTP client with JWT + X-Tenant-ID interceptors |
| **TailwindCSS** | Utility-first styling |

---

## 📂 Source Structure

```
src/
├── api/
│   ├── api.js           # Axios instance + JWT + X-Tenant-ID interceptors
│   ├── auth.js          # Auth API (login, register, logout, me)
│   ├── menu.js          # Category + MenuItem CRUD + public menu
│   ├── admin.js         # Admin user/restaurant management
│   ├── orders.js        # Order placement + status + cancel
│   ├── qr.js            # QR code generation
│   └── restaurant.js    # Restaurant profile management
├── components/
│   ├── AdminRoute.jsx       # Admin-only route guard
│   ├── ProtectedRoute.jsx   # Auth-required route guard
│   ├── ConfirmDialog.jsx    # Reusable confirmation modal (danger-aware)
│   ├── ErrorBoundary.jsx    # React error boundary fallback
│   └── menu/
│       ├── CategorySection.jsx   # Collapsible category card with sub-category support
│       ├── MenuItemCard.jsx      # Menu item display card with actions
│       └── MenuItemModal.jsx     # Add/Edit menu item modal with image preview
├── context/
│   └── AuthContext.jsx    # Global auth state: user, JWT, activeTenantId (multi-tenant)
├── hooks/
│   ├── useRestaurant.js   # Restaurant fetch + state management
│   └── useMenuData.js     # Category + item CRUD + state management
├── layouts/
│   └── AppLayout.jsx      # Sidebar nav + mobile drawer + admin impersonation banner
└── pages/
    ├── LoginPage.jsx            # JWT login form
    ├── SignupPage.jsx           # Owner/Customer registration
    ├── DashboardPage.jsx        # Owner analytics dashboard
    ├── RestaurantProfilePage.jsx # Edit restaurant profile + logo
    ├── MenuManagementPage.jsx   # Hierarchical category + item management
    ├── QRCodePage.jsx           # Table QR code generator + download
    ├── OrdersPage.jsx           # Owner order management + status updates
    ├── PublicMenuPage.jsx       # Customer-facing digital menu (no auth)
    ├── AdminUsersPage.jsx       # Admin: user list + subscription management + delete
    ├── AdminRestaurantsPage.jsx # Admin: restaurant list + delete
    └── NotFoundPage.jsx         # 404 fallback
```

---

## ⚙️ Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   ```env
   # frontend/.env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Runs at **http://localhost:3000** (or port shown in terminal).

4. **Build for production**
   ```bash
   npm run build
   ```

---

## 🔑 Key Patterns

### Multi-Tenant API Calls
Every Axios request automatically includes:
- `Authorization: Bearer <access_token>` (from localStorage)
- `X-Tenant-ID: <activeTenantId>` (from AuthContext, if set)

This allows the backend to scope all data to the correct restaurant.

### Role-Based Navigation
`AppLayout` renders different sidebar nav links based on `user.role`:
- **Owner**: Dashboard, Orders, Restaurant Profile, Menu Management, QR Code
- **Admin** (without tenant): Admin Dashboard, Manage Users, Manage Restaurants
- **Admin** (with tenant active): Switches to owner-style nav for impersonation

### Admin Impersonation
When an admin sets `activeTenantId`, an amber banner appears at the top of the layout showing the impersonated restaurant ID with an "Exit Impersonation" button.

### Hierarchical Categories
`MenuManagementPage` renders:
1. **Top-level categories** as `CategorySection` with `isTopLevel=true` — shows "Add Sub" button.
2. **Sub-categories** nested inside their parent `CategorySection`, rendered as collapsible children.
3. Clicking the chevron toggles collapse/expand state tracked in `collapsedCategories` state map.
