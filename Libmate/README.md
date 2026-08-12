# LibMate 2.0 — Complete Documentation

## Welcome 

I built LibMate 2.0 as a comprehensive book-sharing platform for my SDGP project. It's a full-stack application with a Flask backend API, a React web application for desktop users, and a React Native mobile app. This README covers everything about the project and how all the pieces fit together.

---

##  Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Backend API](#backend-api)
5. [Mobile App](#mobile-app)
6. [Web Frontend](#web-frontend)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

I created LibMate 2.0 with three main components that work together:

| Component | Tech Stack | Purpose |
|-----------|-----------|---------|
| **Backend** | Flask, SQLAlchemy, MySQL | REST API for all platform operations |
| **Mobile App** | React Native, Expo, Zustand | iOS/Android app for book browsing and borrowing |
| **Web Frontend** | React, Vite, Tailwind CSS | Web interface for users and admins |

### What I Built

The platform includes:
- **User Management** — Registration, authentication, user profiles
- **Book Catalogue** — Browse, search, and filter thousands of books
- **Borrowing System** — Borrow and return books, track your borrowing history
- **Personalized Recommendations** — Smart suggestions based on your reading habits
- **Real-time Notifications** — Get alerts about returns, new arrivals, and more
- **Admin Dashboard** — Complete control to manage users, books, and borrowings
- **Wishlist** — Save books you want to read later
- **Trending Section** — See what books are popular

---

## Quick Start

Want to get LibMate running? Follow these steps to set up all three components locally.

### Prerequisites

Here's what you'll need installed:

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.11 or 3.12 | `python3 --version` |
| Node.js | 18, 20, or 22 LTS | `node --version` |
| MySQL | 8.x | `mysql --version` |
| Git | Any | `git --version` |

### Setup All Components (30–45 minutes)

I've set it up so you can get everything running in about 30-45 minutes. Here's how I did it:

#### Step 1: Clone the Repository

```bash
git clone <repo-url>
cd Libmate
```

#### Step 2: MySQL Database Setup

```bash
# Set root password
sudo mysql
```

Inside MySQL:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'libmate2024';
FLUSH PRIVILEGES;
EXIT;
```

Load the database schema:
```bash
mysql -u root -p < ../Test_database/Libmate2.0_Test.sql
mysql -u root -p libmate_test < ../Test_database/Libmate2.0_Test_insert.sql
```

Verify:
```bash
mysql -u root -p -e "USE libmate_test; SHOW TABLES;"
```

#### Step 3: Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file with:
# FLASK_ENV=development
# FLASK_DEBUG=True
# DATABASE_URL=mysql+pymysql://root:libmate2024@localhost/libmate_test

python import_books.py
python run.py
```

Backend runs at `http://localhost:5000`

#### Step 4: Web Frontend Setup

```bash
cd ../website_frontend
npm install

# Update API URL in src/services/api.js if needed

npm run dev
```

Web app runs at `http://localhost:5173`

#### Step 5: Mobile App Setup

```bash
cd ../libmate-mobile
npm install

# Update API URL in src/api/client.js if needed

npm start
```

Scan QR code with Expo Go app on your phone

---

## Project Structure

```
Libmate/
├── SETUP_GUIDE.md
├── README.md                    # ← You are here
│
├── backend/                     # Flask REST API
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── config.py
│   │   ├── models.py            # Database models
│   │   ├── api/                 # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── books.py
│   │   │   ├── borrowings.py
│   │   │   ├── recommendations.py
│   │   │   ├── trending.py
│   │   │   ├── users.py
│   │   │   └── ...
│   │   ├── services/            # Business logic
│   │   │   ├── email_service.py
│   │   │   ├── notification_service.py
│   │   │   └── recommendation_service.py
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
│
├── website_frontend/            # React + Vite web app
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin features
│   │   │   ├── auth/
│   │   │   └── user/
│   │   ├── context/             # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
└── libmate-mobile/              # React Native Expo app
    ├── src/
    │   ├── api/                 # API client
    │   │   ├── auth.js
    │   │   ├── books.js
    │   │   ├── borrowings.js
    │   │   └── client.js
    │   ├── components/          # Reusable components
    │   ├── screens/             # Screen components
    │   │   ├── auth/
    │   │   ├── borrowings/
    │   │   ├── catalogue/
    │   │   ├── home/
    │   │   ├── profile/
    │   │   └── ...
    │   ├── navigation/
    │   │   └── AppNavigator.js
    │   ├── store/               # Zustand state
    │   │   ├── authStore.js
    │   │   └── wishlistStore.js
    │   └── App.js
    ├── package.json
    └── app.json

Test_database/
├── Libmate2.0_Test.sql          # Schema
└── Libmate2.0_Test_insert.sql   # Sample data
```

---

## Backend API

### Overview

I built the backend using Flask and SQLAlchemy to handle all the core operations of LibMate. It's a RESTful API that manages authentication, books, borrowings, recommendations, and notifications. Located in `backend/`

### Starting the Development Server

To get the backend running:

```bash
cd backend
python run.py
# Available at http://localhost:5000
```

### Key Endpoints

#### Authentication
```
POST   /api/auth/login              Login user
POST   /api/auth/register           Register new user
POST   /api/auth/logout             Logout user
POST   /api/auth/refresh-token      Refresh JWT
```

#### Books
```
GET    /api/books                   List all books
GET    /api/books/<id>              Get book details
POST   /api/books                   Create book (admin)
PUT    /api/books/<id>              Update book (admin)
DELETE /api/books/<id>              Delete book (admin)
```

#### Borrowings
```
GET    /api/borrowings              Get user's borrowings
POST   /api/borrowings              Borrow a book
PUT    /api/borrowings/<id>         Return a book
GET    /api/borrowings/history      Borrowing history
```

#### Users
```
GET    /api/users/profile           Get current user profile
PUT    /api/users/profile           Update profile
GET    /api/users/<id>              Get user (public info)
```

#### Recommendations
```
GET    /api/recommendations         Get personalized recommendations
GET    /api/trending                Get trending books
```

#### Notifications
```
GET    /api/notifications           Get user notifications
POST   /api/notifications/<id>/read Mark as read
```

### Database Models

- **User** — User accounts, authentication
- **Book** — Book inventory, metadata
- **Borrowing** — Borrowing records, history
- **Recommendation** — Personalized recommendations
- **Notification** — User notifications
- **Membership** — User membership tiers

### Testing

```bash
cd backend
pytest                          # Run all tests
pytest tests/test_books.py      # Run specific test file
pytest --cov=app               # Run with coverage
```

### Environment Variables

```
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=mysql+pymysql://root:libmate2024@localhost/libmate_test
JWT_SECRET_KEY=your-secret-key
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

### Docker

```bash
cd backend
docker build -t libmate-backend .
docker run -p 5000:5000 -e DATABASE_URL=mysql+pymysql://... libmate-backend
```

---

## Mobile App

### Overview

I created the mobile app using React Native and Expo, so users can access LibMate on both iOS and Android. The app uses Zustand for state management to keep things simple and efficient. Located in `libmate-mobile/`

### Starting the Development Server

To run the mobile app:

### Supported Platforms

- iOS (via Expo Go or TestFlight)
- Android (via Expo Go or APK)

### Key Screens

| Screen | Purpose |
|--------|---------|
| LoginScreen | User authentication |
| RegisterScreen | New user registration |
| HomeScreen | Main feed and discovery |
| CatalogueScreen | Browse all books |
| BookDetailScreen | Full book information |
| MyBooksScreen | User's borrowed books |
| RecommendationsScreen | Personalized suggestions |
| WishlistScreen | Saved books |
| ProfileScreen | User profile and settings |
| NotificationsScreen | System notifications |

### State Management

Uses **Zustand** for global state:

```javascript
// authStore.js
import { create } from 'zustand';

export const useAuthStore = create(set => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// Usage in component
const { user, login } = useAuthStore();
```

### API Integration

Centralized in `src/api/`:

```javascript
// src/api/client.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
});
```

### Running on Emulator

**iOS:**
```bash
npm start
Press i
```

**Android:**
```bash
npm start
Press a
```

### Building for Production

```bash
npm install -g eas-cli
eas build:configure
eas build --platform ios
eas build --platform android
```

---

## Web Frontend

### Overview

I built the web app using React and Vite for fast development, with Tailwind CSS for styling. It's designed for desktop users and includes both regular user features and a full admin dashboard. Located in `website_frontend/`

### Starting the Development Server

To run the web app:

```bash
cd website_frontend
npm install
npm run dev
# Available at http://localhost:5173
```

### Key Pages

#### User Pages
- **Home** — Main feed
- **Catalogue** — Browse books
- **Book Detail** — Full book information
- **My Books** — Borrowed books
- **Wishlist** — Saved books
- **Recommendations** — Suggested books
- **Profile** — User settings
- **Notifications** — System notifications

#### Admin Pages
- **Dashboard** — System overview
- **Book Management** — Add/edit/delete books
- **User Management** — Manage users
- **Borrowing Management** — View all borrowings
- **Reports** — Generate reports

### Styling

Uses **Tailwind CSS**:

```jsx
<div className="bg-white rounded-lg shadow-md p-4">
  <h2 className="text-lg font-bold">{title}</h2>
</div>
```

### State Management

Uses **React Context API**:

```jsx
// AuthContext.jsx
import { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ...
  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Docker

```bash
cd website_frontend
docker build -t libmate-frontend .
docker run -p 80:80 libmate-frontend
```

---

## Deployment

### Backend Deployment

**Using Docker:**
```bash
cd backend
docker build -t libmate-backend .
docker run -p 5000:5000 \
  -e DATABASE_URL=mysql+pymysql://user:pass@host/db \
  -e FLASK_ENV=production \
  libmate-backend
```

**Environment Variables for Production:**
```
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=mysql+pymysql://user:pass@host/db
JWT_SECRET_KEY=secure-random-key
```

### Web Frontend Deployment

**Using Docker:**
```bash
cd website_frontend
docker build -t libmate-frontend .
docker run -p 80:80 libmate-frontend
```

**Using Vercel, Netlify, or GitHub Pages:**
```bash
npm run build
# Deploy the dist/ folder
```

### Mobile App Deployment

**iOS via EAS:**
```bash
eas build --platform ios
eas submit --platform ios
```

**Android via EAS:**
```bash
eas build --platform android
eas submit --platform android
```

---

## Common Tasks

Here's how I structure development work on LibMate:

### Adding a New Endpoint

1. **Backend** — Add route in `backend/app/api/`
2. **Web Frontend** — Add API call in `src/services/api.js`
3. **Mobile App** — Add API call in `src/api/`
4. **Test** — Add tests in `backend/tests/`

### Adding a New Page

1. **Web Frontend** — Create component in `src/pages/`
2. **Mobile App** — Create screen in `src/screens/`

### Adding a New Component

1. **Web Frontend** — Create in `src/components/`
2. **Mobile App** — Create in `src/components/`

### Running Tests

**Backend:**
```bash
cd backend
pytest
pytest --cov=app
```

---

## Troubleshooting

### Backend Won't Start

```
Error: (pymysql.err.OperationalError) (2003, "Can't connect to MySQL server")
```

**Solution:**
- Ensure MySQL is running: `mysql -u root -p`
- Check `DATABASE_URL` in `.env`
- Verify database `libmate_test` exists

### Mobile App Won't Connect to Backend

```
TypeError: Network request failed
```

**Solutions:**
- Verify backend is running: `http://localhost:5000`
- On Android emulator, use `10.0.2.2` instead of `localhost`
- Check `API_URL` in `src/api/client.js`
- Verify phone and dev machine are on same WiFi

### Web Frontend Won't Build

```
Error: ENOENT: no such file or directory
```

**Solution:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Vite Port Already in Use

```bash
npm run dev -- --port 3000
```

### Python Import Errors

```
ModuleNotFoundError: No module named 'app'
```

**Solution:**
```bash
cd backend
pip install -r requirements.txt
python run.py
```

---

## Development Workflow

Here's how I structured the development process:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** across backend, frontend, or mobile

3. **Test locally**
   - Backend: `pytest`
   - Web/Mobile: Manual testing

4. **Run linters**
   ```bash
   # Backend
   cd backend && pytest --pylint

   # Frontend/Mobile
   npm run lint
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

6. **Create pull request** and request review

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Flask | 2.x |
| ORM | SQLAlchemy | 2.x |
| Database | MySQL | 8.x |
| Mobile | React Native | 0.71+ |
| Mobile Build | Expo | Latest |
| Frontend | React | 18+ |
| Frontend Build | Vite | 4.x |
| Styling | Tailwind CSS | 3.x |
| HTTP Client | Axios | Latest |
| State (Mobile) | Zustand | Latest |
| State (Web) | React Context | Built-in |

---

## Code Style

- **Python** — PEP 8, type hints
- **JavaScript/React** — ESLint, Prettier
- **CSS** — Tailwind utility classes

---

## License

This is my SDGP project at UWE Bristol.

---

## Getting Help

If you run into issues:

1. Check the troubleshooting section above
2. Review component READMEs for detailed information
3. Check backend logs: `backend/run.py` output
4. Check browser console for frontend errors
5. Check terminal output for mobile app errors

---

**Thanks for checking out my LibMate project! **

Feel free to reach out if you have any questions!
