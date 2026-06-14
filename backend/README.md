# Psychic Magic — Backend API

ASP.NET Core backend on .NET 10 with MySQL and Stripe integration for Psychic Reading appointments and spell product orders.

## Prerequisites

- .NET SDK 10.0
- **MySQL 8.0+** (or MariaDB 10.5+)
- Stripe account (payments)

## Installation

1. Restore .NET dependencies:
```bash
dotnet restore BookingSystem.Api.csproj
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Create MySQL database:
```bash
# Log in to MySQL
mysql -u root -p

# Create database
CREATE DATABASE bookingsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit
EXIT;
```

4. Run migrations:
```bash
dotnet run --project BookingSystem.Api.csproj -- --migrate
```

5. Seed data:
```bash
dotnet run --project BookingSystem.Api.csproj -- --seed
```

This creates:
- Service types (Psychic Reading 15 / 30 / 60 min)
- Business hours (configurable weekly schedule; seed sets Mon–Thu 9:00–17:00 open)
- Initial admin user

## Running the Server

Development (hot reload):
```bash
dotnet watch run --project BookingSystem.Api.csproj
```

Production:
```bash
dotnet run --no-launch-profile --project BookingSystem.Api.csproj
```

Server defaults to `http://localhost:5000`

## Environment Variables

Key variables (see `.env.example` for the full list):

```env
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bookingsys
DB_USER=root
DB_PASSWORD=your_password

# JWT secrets (must change in production!)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key

# Email (optional, development)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App / frontend
APP_BASE_URL=http://localhost:3000
SUPPORT_EMAIL=support@example.com
FRONTEND_URLS=http://localhost:3000,http://localhost:3001

# Admin user (initial seed)
ADMIN_EMAIL=admin@massage.com
ADMIN_PASSWORD=admin123
```

## API Endpoints

### Public
- `GET /health` — Health check
- `GET /api/bookings/service-types`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `GET /api/bookings/manage/:token`
- `POST /api/bookings/manage/:token/reschedule-request`
- `GET /api/availability/slots`
- `POST /api/product-orders`
- `GET /api/product-orders/:id`
- `POST /api/webhooks/stripe`

### Admin
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
- `GET /api/admin/product-orders`
- `PATCH /api/admin/product-orders/:id/fulfill`

## Database Schema

### Tables
- `customers` — Customer records
- `bookings` — Appointment records
- `payments` — Stripe payment records (bookings)
- `product_orders` — Spell product orders
- `availability_blocks` — Blocked periods
- `business_hours` — Weekly business hours
- `admins` — Admin users
- `service_types` — Services and pricing

### Features
- Foreign keys for consistency
- CHECK constraints for validation
- Automatic `updated_at` timestamps
- Indexes for query performance

## Project Structure

```
backend/
├── Controllers/          # API controllers
├── Services/             # Business logic
├── Models/               # Request/response models
├── Middleware/           # Error handling, etc.
├── Database/             # MySQL connection, migrations, seeding
├── Configuration/        # .env and config loading
├── src/database/         # SQL migrations and seeds
├── .env                  # Environment variables
├── .env.example          # Environment template
├── BookingSystem.Api.csproj
└── Program.cs            # ASP.NET Core entry
```

## Development Progress

✅ **Phases 1–6 pre-launch (done)**
- Backend structure
- MySQL database and migrations
- Admin authentication
- Customer booking and payment initialization
- Stripe webhook updates
- Admin booking management
- Customer reschedule requests
- Spell product orders
- Basic email notifications

## Testing

```bash
dotnet build BookingSystem.Api.csproj
```

(Currently verified mainly via `dotnet build`. Full E2E suite lives on branch `test/e2e-bdd-playwright`; see root README.)

## Security

- Never commit `.env` to version control
- Change the default admin password after first login
- Use strong JWT secrets in production
- Enable HTTPS in production (Stripe requirement)

## License

ISC
