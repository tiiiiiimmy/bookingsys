# Psychic Magic — Psychic Consultation & Spell Product Site

An online business system for psychics and readers: **Psychic Reading appointments** and **spell product purchases**, both paid via Stripe. The brand site is [Psychic Magic](http://localhost:3000), operated by New Zealand psychic Manon.

## Project Overview

### Business configuration (seed defaults; adjustable in admin)

- **Appointment services**: Psychic Reading (15 min $26 / 30 min $48 / 60 min $88)
- **Spell products**: White Magic, Love Spell, Money Spell ($88 each, one-time checkout)
- **Business hours**: Configure open days and time windows in admin (seed default: Mon–Thu 9:00–17:00)
- **Payment**: Stripe online (appointments and product orders require payment first)
- **Refunds**: Manual (admin decides case by case)
- **Customer accounts**: No registration (guest checkout)
- **Calendar**: In-app custom availability slots

### Features

**Customer-facing:**
- Browse the homepage, About Manon, spell products, and Psychic Reading services
- Choose Psychic Reading duration and book an available slot
- Submit appointments or product orders without registering
- Pay via Stripe and see real status on confirmation pages
- Request reschedules via a secure manage link
- Order White Magic / Love Spell / Money Spell from the homepage

**Admin:**
- View all appointments, product orders, and details in the dashboard
- Manage appointments (reschedule, cancel, complete, no-show)
- Mark paid product orders as fulfilled
- Configure availability (business days and blocked periods)
- View customer history
- Review customer reschedule requests

## Tech Stack

- **Backend**: .NET 10 + ASP.NET Core + MySQL
- **Frontend**: React (Vite)
- **Payments**: Stripe
- **Auth**: JWT

## Project Structure

```
bookingsys/
├── backend/          # ASP.NET Core API server
│   ├── Controllers/       # API controllers
│   ├── Services/          # Business logic
│   ├── Models/            # Request/response models
│   ├── Middleware/        # Auth, error handling
│   ├── Database/          # MySQL connection, migrations, seeding
│   ├── Configuration/     # .env and config loading
│   ├── src/database/      # SQL migrations and seed data
│   ├── BookingSystem.Api.csproj
│   └── Program.cs
│
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Pages (home, booking, product checkout, etc.)
│   │   ├── services/        # API clients
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # Context providers
│   │   └── App.jsx          # App entry
│   └── package.json
│
├── test/             # Playwright + BDD end-to-end tests
└── README.md         # This file
```

## Quick Start

### Prerequisites

- .NET SDK 10.0
- Node.js 18+ (frontend)
- MySQL 8.0+
- Stripe account (payments)

### Setup

#### 1. Backend

```bash
cd backend

# Restore .NET dependencies
dotnet restore BookingSystem.Api.csproj

# Configure environment
cp .env.example .env
# Edit .env with database and Stripe settings

# Create MySQL database
mysql -u root -p
CREATE DATABASE bookingsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
\q

# Run migrations
dotnet run --project BookingSystem.Api.csproj -- --migrate

# Seed data (Psychic Reading services, business hours, admin user)
dotnet run --project BookingSystem.Api.csproj -- --seed

# Start backend
dotnet watch run --project BookingSystem.Api.csproj
```

Backend runs at `http://localhost:5000`

**Default admin credentials** (from `.env` `ADMIN_EMAIL` / `ADMIN_PASSWORD`; seed fallback if unset):
- Email: `admin@massage.com`
- Password: `admin123`
- ⚠️ **Change the password immediately after first login!**

#### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set API URL and Stripe publishable key

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bookingsys
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT secrets (change in production!)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email (optional, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App / frontend
APP_BASE_URL=http://localhost:3000
SUPPORT_EMAIL=support@example.com
FRONTEND_URLS=http://localhost:3000,http://localhost:3001
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Development Progress

✅ **Phase 1: Foundation (done)**
- ✅ ASP.NET Core backend
- ✅ MySQL database and migrations
- ✅ Admin auth (JWT)
- ✅ React frontend scaffold
- ✅ Admin login and dashboard

✅ **Phase 2: Availability (done)**
- ✅ Business hours management
- ✅ Blocked-period management
- ✅ Public slot availability API

✅ **Phase 3–6: Pre-launch main flows (done)**
- ✅ Psychic Reading: pay before confirm
- ✅ Stripe PaymentIntent + webhook updates
- ✅ Admin booking list, detail, status updates, direct reschedule
- ✅ Customer list and detail
- ✅ Customer reschedule requests and admin review
- ✅ Spell product checkout (White Magic / Love Spell / Money Spell) and fulfillment
- ✅ Basic email notifications

## API Endpoints

### Public (implemented)
- `GET /health` — Health check
- `GET /api/bookings/service-types` — Bookable services (Psychic Reading durations)
- `POST /api/bookings` — Create booking
- `GET /api/bookings/:id` — Booking detail
- `GET /api/bookings/manage/:token` — Customer manage page (reschedule entry)
- `POST /api/bookings/manage/:token/reschedule-request` — Submit reschedule request
- `GET /api/availability/slots` — Available slots
- `POST /api/product-orders` — Create spell product order
- `GET /api/product-orders/:id` — Product order detail
- `POST /api/webhooks/stripe` — Stripe webhook

### Admin (implemented)
- `POST /api/admin/auth/login` — Admin login
- `POST /api/admin/auth/refresh` — Refresh token
- `GET /api/admin/auth/me` — Current admin
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/bookings`
- `GET /api/admin/bookings/:id`
- `PATCH /api/admin/bookings/:id/status`
- `POST /api/admin/bookings/:id/reschedule`
- `GET /api/admin/customers`
- `GET /api/admin/customers/:id`
- `POST /api/admin/reschedule-requests/:id/approve`
- `POST /api/admin/reschedule-requests/:id/reject`
- `GET /api/admin/product-orders` — Product order list
- `PATCH /api/admin/product-orders/:id/fulfill` — Mark product order fulfilled

## Database Schema

### Core tables
- `customers` — Customer records
- `bookings` — Psychic Reading appointments (exclusive constraints prevent double booking)
- `payments` — Stripe payment records (bookings)
- `product_orders` — Spell product orders (White Magic / Love Spell / Money Spell)
- `availability_blocks` — Blocked time ranges
- `business_hours` — Weekly business hours
- `admins` — Admin users
- `service_types` — Appointment services and pricing

## Testing

> **Branch note (read this on `main`)**  
> This document ships on **`main`** and describes the full Psychic Magic site. The **runnable automated test suite is not on `main`**; it lives on feature branch **`test/e2e-bdd-playwright`**.
>
> | Branch | Contents |
> |--------|----------|
> | **`main`** | Production frontend/backend + this README; under `test/` only the test **design** doc [`test/doc/test-design.md`](test/doc/test-design.md) |
> | **`test/e2e-bdd-playwright`** | Full **`test/`** tree on top of the app: Playwright + playwright-bdd scenarios, page objects, DB/API helpers, run reports (~54 automated scenarios) |
>
> To run tests locally or read implementations, check out the test branch:
>
> ```bash
> git fetch origin
> git checkout test/e2e-bdd-playwright
> ```
>
> Before merging to `main`, run `cd test && npm run test:regression` on that branch for a full regression. Latest reports: [`test/doc/reports/`](test/doc/reports/) (e.g. run #005: 54 passed, 1 xfail).

### Manual access
- **Customer home**: http://localhost:3000
- **Book Psychic Reading**: http://localhost:3000/booking
- **Spell product checkout**: http://localhost:3000/order?product=White%20Magic
- **Admin login**: http://localhost:3000/admin/login
- **Admin dashboard**: http://localhost:3000/admin/dashboard

### End-to-end automation (E2E)

The following applies to the `test/` directory on branch **`test/e2e-bdd-playwright`** (not present on `main`; see **Branch note** above).

The `test/` suite uses **Playwright + playwright-bdd**: a real browser drives the frontend against a
**real .NET backend** with direct **MySQL test DB** assertions. Stripe is fully mocked (backend
`STRIPE_FAKE_PAYMENTS` + forged signed webhooks; the test browser blocks `stripe.com`). No external services are called.

- **Layers**: **44 browser E2E** (`test:e2e`, UI→API→DB) + **10 API/contract** scenarios
  (`test:api`, no browser; DB seed + forged webhooks / direct API asserts); `test:regression` runs all 54.
- **Coverage** (UI → API → DB):
  - Booking (pay success/fail, bad signature, multi-slot, confirmation polling, slot conflict, concurrency & hold expiry, form validation, availability edges)
  - Reschedule (manage page states, conflict requests, admin UI approve/reject, review edge cases)
  - Product orders (White Magic / Love Spell / Money Spell success, unknown product, unpaid stays pending, form validation)
  - Admin (login, session guard/refresh/dual-tab logout, filters/detail/manual reschedule/availability management)
- **Run**:
  ```bash
  cd test
  npm install && npx playwright install chromium
  cp .env.test.example .env.test   # Fill in locally; API_URL port is 5001
  npm run test:regression          # Full: E2E + API (54)
  npm run test:e2e                 # Browser E2E only (44)
  npm run test:api                 # API/contract only (10, fastest)
  npm run test:smoke               # Core @smoke scenarios (4)
  ```
  > Stop any dev backend on the test port before running (tests start their own backend on `bookingsys_test`).
- **Docs**: Suite guide [`test/README.md`](test/README.md), case list [`test/doc/test-cases.md`](test/doc/test-cases.md), reports [`test/doc/reports/`](test/doc/reports/).
- **Known gaps**: TC-RS-10 (backend reschedule approval race, xfail); TC-AD-11 business-hours `start>end` sub-case (backend does not validate; not automated).

## Security

- ✅ Never commit `.env` to version control
- ✅ Change the default admin password after first login
- ✅ Use strong JWT secrets in production
- ✅ Enable HTTPS in production (Stripe requirement)
- ✅ Use Stripe test keys during development

## Troubleshooting

### Backend cannot connect to database
- Ensure MySQL is running
- Check database credentials in `.env`
- Confirm database `bookingsys` exists

### Frontend cannot reach backend
- Ensure the backend is running
- Check `VITE_API_URL`
- Check CORS settings

### Admin cannot log in
- Run `dotnet run --project BookingSystem.Api.csproj -- --seed`
- Use admin email/password from `.env` (seed default `admin@massage.com` / `admin123`)
- Check backend logs for errors

## License

ISC

## Support

See also:
- Backend README: [backend/README.md](backend/README.md)
