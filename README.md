# AR Maintenance Support System

**Project:** AR-Enhanced Maintenance Support System for Bournemouth Buses  
**Unit:** COMP5067 - Technological Innovations in Computing  
**Level:** 5 | **Weighting:** 70%  
**Deadline:** 12 May 2026  

---

## 📋 Project Overview

This system provides AR-enhanced maintenance support for Bournemouth Buses depot, enabling technicians to:
- Detect and visualize faults using AR markers
- Track tool accountability
- Report and resolve maintenance issues
- Monitor depot operations via supervisor dashboard

---

## 🏗️ System Architecture

```
┌──────────────┐         ┌──────────────┐         ┌─────────────┐
│  AR Client   │         │   Backend    │         │  Dashboard  │
│  (Tablet)    │◄───────►│   (Node.js)  │◄───────►│  (Laptop)   │
└──────────────┘         └──────┬───────┘         └─────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   SQLite DB  │
                         └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm (comes with Node.js)
- Modern web browser with camera access

### Installation

```bash
# Clone the repository
git clone https://github.com/2boxsounds-spec/ar-maintenance-system.git
cd ar-maintenance-system

# Install dependencies
npm install

# Initialize database (creates users with correct passwords)
npm run db:setup

# Start the server
npm start
```

### Access the System

- **AR Frontend:** http://localhost:3000/ar
- **Dashboard:** http://localhost:3000/dashboard
- **API:** http://localhost:3000/api/v1

---

## 📁 Project Structure

```
ar-maintenance-system/
├── README.md                 # This file
├── package.json              # Dependencies & scripts
├── server.js                 # Main server entry point
├── database/
│   ├── schema.sql           # Database schema
│   └── seed.sql             # Sample data
├── api/
│   ├── auth.js              # Authentication endpoints
│   ├── faults.js            # Fault management
│   └── tools.js             # Tool tracking
├── ar-frontend/
│   ├── index.html           # AR interface
│   ├── ar.js                # AR logic
│   └── markers/             # AR marker patterns
├── dashboard/
│   ├── index.html           # Supervisor dashboard
│   ├── dashboard.js         # Dashboard logic
│   └── styles.css           # Dashboard styles
├── security/
│   ├── auth-middleware.js   # JWT validation
│   └── rate-limiter.js      # Rate limiting
└── analytics/
    ├── algorithms.js        # Anomaly detection
    └── reports.js           # Report generation
```

---

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./database/maintenance.db

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=2h
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Default Users

| Username | Password | Role | Assigned Bay |
|----------|----------|------|--------------|
| j.smith | Tech123! | technician | Bay 3 |
| m.jones | Tech456! | technician | Bay 7 |
| supervisor | Super123! | supervisor | All bays |
| admin | Admin123! | admin | All bays |

**⚠️ Change these passwords in production!**

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test API endpoints
npm run test:api
```

---

## 📈 API Documentation

### Authentication

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "j.smith",
  "password": "Tech123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "j.smith",
    "role": "technician",
    "assignedBay": "Bay 3"
  }
}
```

### Faults

```bash
# List all faults
GET /api/v1/faults
Authorization: Bearer <token>

# Get fault by ID
GET /api/v1/faults/:id

# Report new fault
POST /api/v1/faults
Authorization: Bearer <token>

{
  "markerId": "hiro",
  "vehicleId": "Bus 204",
  "busSystem": "brakes",
  "title": "Brake Pad Wear",
  "description": "Front left brake pad at 20%",
  "bayLocation": "Bay 3"
}

# Update fault status
PATCH /api/v1/faults/:id
Authorization: Bearer <token>

{
  "status": "resolved"
}
```

### Tool Events

```bash
# Log tool check-in/out
POST /api/v1/tool-events
Authorization: Bearer <token>

{
  "toolName": "OBD-II Scanner",
  "eventType": "check_out"
}

# List tool events
GET /api/v1/tool-events
```

---

## 🔒 Security Features

- JWT authentication with 2-hour expiry
- bcrypt password hashing (10 rounds)
- Rate limiting (100 requests per 15 minutes)
- Role-based access control (RBAC)
- Bay assignment enforcement
- Comprehensive audit logging
- SQL injection prevention (Sequelize ORM)
- XSS protection (input sanitization)

---

## 📞 Support

**Unit Contact:** Gernot Liebchen  
**QA:** Lai Xu, Festus Adedoyin, Fudong Li, Tim Orman  

**Project Team:**
- Software Engineers: AR/Frontend + Backend/Database
- Security Specialists: Architecture + Implementation
- Data Analysts: Dashboard/Viz + Analytics/Algorithms

---

## 📄 License

University project for COMP5067 - Bournemouth University

---

## 🗓️ Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 12 May 2026 | Initial release (TRL 3) |
