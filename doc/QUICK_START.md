# Quick Start Guide

## Current Version

This repository includes:
- .NET 10 + MySQL 8 backend
- React/Vite frontend
- Stripe pay-before-confirm flow
- Admin booking and customer management
- Customer reschedule requests
- Spell product checkout (White Magic / Love Spell / Money Spell)

## Startup Steps

### 1. Set Up MySQL

```bash
# Log in to MySQL
mysql -u root -p

# Create database
CREATE DATABASE bookingsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Verify
SHOW DATABASES;

# Exit
EXIT;
```

### 2. Start the Backend

```bash
# Enter backend directory
cd /var/www/bookingsys/backend

# Copy environment template
cp .env.example .env
# At minimum configure DB_*, JWT_*, FRONTEND_URLS
# For full payment demo, also configure Stripe and SMTP

# Run migrations
dotnet run --project BookingSystem.Api.csproj -- --migrate

# Seed initial data (admin, service types, business hours)
dotnet run --project BookingSystem.Api.csproj -- --seed

# Start dev server
dotnet watch run --project BookingSystem.Api.csproj
```

Backend defaults to `http://localhost:5000`

### 3. Start the Frontend

**Open a new terminal:**

```bash
# Enter frontend directory
cd /var/www/bookingsys/frontend

# Start dev server
npm run dev
```

**Expected output:**
```
VITE v7.x.x ready in XXX ms

➜  Local:   http://localhost:3000/
```

### 4. Access the App

- **Customer home**: http://localhost:3000/
- **Book Psychic Reading**: http://localhost:3000/booking
- **Spell product checkout**: http://localhost:3000/order?product=White%20Magic
- **Admin login**: http://localhost:3000/admin/login
- **Booking confirmation**: http://localhost:3000/booking/confirmation/:bookingId
- **Manage booking**: via email link `/booking/manage/:token`

### 5. Admin Credentials

```
Email: admin@massage.com
Password: admin123
```

⚠️ **Change the password after first login!**

## Verify the Database

```bash
# List tables
mysql -u root -p bookingsys -e "SHOW TABLES;"

# View admins
mysql -u root -p bookingsys -e "SELECT id, email, first_name FROM admins;"

# View service types
mysql -u root -p bookingsys -e "SELECT * FROM service_types;"

# View business hours
mysql -u root -p bookingsys -e "SELECT * FROM business_hours;"
```

## Common Issues

### Frontend React Errors

If you see "React is not defined":

```bash
cd frontend
npm install
# Then restart: npm run dev
```

### MySQL Connection Failed

Check:
1. MySQL is running: `sudo service mysql status`
2. Database was created (step 1)
3. Credentials in `.env` are correct

### Port Already in Use

If ports 5000 or 3000 are taken:

**Backend (.env):**
```
PORT=5001
```

**Frontend (vite.config.js):**
```javascript
server: { port: 3001 }
```

## Tech Stack

- ✅ .NET 10 + ASP.NET Core
- ✅ **MySQL 8.0+** (migrated from PostgreSQL)
- ✅ React 19
- ✅ React Router v7
- ✅ Axios
- ✅ Stripe (configure as needed)
- ✅ JWT authentication

## Suggested Verification Order

1. Log in to admin, open dashboard, bookings, and customers
2. Create a booking and reach the Stripe payment step
3. Pay with a Stripe test card; confirm booking becomes `confirmed`
4. Open the manage link, submit a reschedule request, approve it in admin
