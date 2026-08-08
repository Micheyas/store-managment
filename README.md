# 🏪 StoreMS — Store Management System

A full-stack store management system built for small and medium businesses.
Manage products, stock, sales, expenses, and staff — all in one place.

**Live Demo:** [store-managment-nine.vercel.app](https://store-managment-nine.vercel.app)

---

## ✨ Features

### Core
- 🛒 **POS (Point of Sale)** — fast product search, barcode scan, cart, discount, receipt printing
- 📦 **Products** — add/edit/delete products with images, SKU, category, cost/selling price
- 🏪 **Stock Management** — stock in/out, adjustments, transfers between branches, movement history
- 📋 **Sales History** — full transaction log with filters, invoice detail modal
- 📈 **Reports** — daily sales chart, top products, profit & loss, payment breakdown
- 💸 **Expenses** — track rent, salary, utilities, and more (owner only)

### Operations
- 🚚 **Purchase Orders** — create orders, receive stock from suppliers
- 🤝 **Suppliers** — manage your suppliers
- 🏷️ **Categories** — organize products by category
- 💱 **Currency** — multi-currency support with live rate refresh

### Access Control
- 👑 **Owner** — full access including profit reports and user management
- 🔧 **Manager** — manage products, stock, sales, and basic reports
- 🛒 **Cashier** — POS only, view limited stock

### Admin
- 📋 **Activity Log** — see who did what and when
- 🖥️ **IT Management** — user account management with approval workflow
- ✅ **Approvals** — owner approves IT actions before they execute

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon cloud) |
| ORM | Sequelize |
| Auth | JWT (jsonwebtoken) |
| Images | Cloudinary |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👑 Owner | admin@store.com | admin123 |
| 🔧 Manager | manager@store.com | manager123 |
| 🛒 Cashier | cashier@store.com | cashier123 |
| 🖥️ IT | it@store.com | it123456 |

---

## 🚀 Run Locally

### Prerequisites
- Node.js v18+
- PostgreSQL database (or use Neon free tier)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your DB and JWT credentials
npm run dev
```
Server runs on `http://localhost:5001`

### Frontend
```bash
cd frontend
npm install
npm start
```
App runs on `http://localhost:3000`

### Environment Variables (backend/.env)
```
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=neondb
DB_USER=your_db_user
DB_PASS=your_db_password
JWT_SECRET=your_jwt_secret
PORT=5001
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
Store-Management/
├── backend/
│   ├── controllers/    # Business logic
│   ├── models/         # Sequelize models
│   ├── routes/         # Express routes
│   ├── middleware/      # Auth middleware
│   └── server.js       # Entry point
└── frontend/
    ├── src/
    │   ├── pages/      # React pages
    │   ├── components/ # Shared components
    │   ├── styles/     # Global CSS
    │   └── api.js      # Axios instance
    └── public/
```

---

## 🗺️ Roadmap

- [ ] Customer management + purchase history
- [ ] Sales returns / refunds
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Email notifications for low stock
- [ ] Export reports to PDF/Excel
