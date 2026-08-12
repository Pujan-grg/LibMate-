# LibMate 2.0 — Friend Setup Guide

> This guide sets up the full LibMate 2.0 system: Flask backend, React web app, and Expo React Native mobile app.
> Estimated time: 30–45 minutes (mostly MySQL setup).

---

## What You Need Before Starting

| Tool | Version | Check with |
|------|---------|------------|
| Python | 3.11 or 3.12 recommended | `python3 --version` |
| Node.js | 18, 20, or 22 LTS | `node --version` |
| MySQL | 8.x | `mysql --version` |
| Expo Go app | Latest | Install from App Store / Play Store on your phone |
| Git | Any | `git --version` |

> **Python note:** Use Python 3.11 or 3.12. Some pinned packages in `requirements.txt` (e.g. `cryptography==41.0.7`) may not have pre-built wheels for Python 3.13/3.14 and will require compiling from source, which is painful. Stick to 3.11 or 3.12 to avoid this.

---

## Step 1 — Clone the Repo

```bash
git clone <repo-url-from-prince>
cd SDPP
```

The project has three parts inside `Libmate/`:
```
Libmate/
  backend/          ← Flask API
  website_frontend/ ← Vite + React web app
  libmate-mobile/   ← Expo React Native app

Test_database/      ← SQL files to set up the DB
```

---

## Step 2 — MySQL Setup

### 2a. Install MySQL (if not already installed)

**macOS (Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Windows:** Download MySQL 8.x Community Installer from mysql.com

**Ubuntu/Debian:**
```bash
sudo apt install mysql-server
sudo systemctl start mysql
```

### 2b. Set the root password

> MySQL 8.4 removed the old auth plugin. Use this exact syntax — do NOT add `IDENTIFIED WITH mysql_native_password`.

```bash
sudo mysql
```

Inside MySQL:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'libmate2024';
FLUSH PRIVILEGES;
EXIT;
```

Then verify you can log in:
```bash
mysql -u root -p
# Enter: libmate2024
```

### 2c. Create the database and load the schema

```bash
mysql -u root -p < Test_database/Libmate2.0_Test.sql
```

When prompted, enter `libmate2024`.

Then load the sample data:
```bash
mysql -u root -p libmate_test < Test_database/Libmate2.0_Test_insert.sql
```

Verify it worked:
```bash
mysql -u root -p -e "USE libmate_test; SHOW TABLES;"
```

You should see 8+ tables (users, books, borrowings, etc.).

---

## Step 3 — Backend Setup

### 3a. Create the `.env` file

The `.env` file is NOT in the repo (gitignored for security). Ask Prince to share it, or create it manually:

```bash
cd Libmate/backend
```

Create a file called `.env` with this content (ask Prince for the real email password if you need email features):

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=libmate2024
DB_NAME=libmate_test

JWT_SECRET_KEY=your-super-secret-key

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=bivid005@gmail.com
MAIL_PASSWORD=<ask-prince-for-this>
MAIL_DEFAULT_SENDER=LibMate <bivid005@gmail.com>

DEFAULT_ADMIN_EMAIL=admin@libmate.com
DEFAULT_ADMIN_PASSWORD=admin123

FLASK_ENV=development
DEBUG=True
PORT=5000

FINE_RATE_PER_DAY=5.00
MAX_BORROW_LIMIT=5
RESERVATION_HOURS=48
```

### 3b. Create a virtual environment and install packages

```bash
cd Libmate/backend

python3 -m venv .venv

# macOS / Linux:
source .venv/bin/activate

# Windows:
.venv\Scripts\activate

pip install -r requirements.txt
```

### 3c. Run the backend

```bash
python run.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
```

Keep this terminal open. The backend must stay running while you test the app.

**Quick test:** Open `http://localhost:5000/api/books` in your browser. You should see JSON with a list of books.

---

## Step 4 — Web Frontend Setup

Open a **new terminal** (keep the backend running).

```bash
cd Libmate/website_frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

**Login credentials:**
- Admin: `admin@libmate.com` / `admin123`
- Or register a new user account from the web app

---

## Step 5 — Mobile App Setup

### 5a. Install dependencies

Open another **new terminal**.

```bash
cd Libmate/libmate-mobile
npm install
```

### 5b. Networking — important!

Your phone and laptop must be on the **same WiFi network**.

> **University/dorm WiFi problem:** Many campus networks block device-to-device traffic. If the app can't connect, the fix is:
> 1. Create a mobile hotspot from your laptop
> 2. Connect your phone to that hotspot
> 3. Then run the app

The app auto-detects the backend IP — you don't need to change any config file.

### 5c. Install Expo Go on your phone

- Android: Play Store → search "Expo Go"
- iOS: App Store → search "Expo Go"

### 5d. Start the app

```bash
npx expo start
```

A QR code appears in the terminal.

- **Android:** Open the Expo Go app → tap "Scan QR code" → scan it
- **iOS:** Open the Camera app → point at the QR code → tap the notification

The app will bundle and launch on your phone (takes ~30 seconds the first time).

### 5e. Log in

Use the same credentials as the web app. Register a new account or use:
- `admin@libmate.com` / `admin123` (admin, may have limited mobile screens)
- Register a regular user account for full mobile experience

---

## Step 6 — Running Everything Together

You need **3 terminals open at the same time:**

| Terminal | Command | What it runs |
|----------|---------|--------------|
| 1 | `cd Libmate/backend && python run.py` | Flask API on port 5000 |
| 2 | `cd Libmate/website_frontend && npm run dev` | Web app on port 5173 |
| 3 | `cd Libmate/libmate-mobile && npx expo start` | Mobile dev server |

---

## Troubleshooting

### Backend won't start — "Access denied for user root"
The MySQL password isn't set up correctly. Re-do Step 2b.

### Backend won't start — "Unknown database libmate_test"
The SQL schema wasn't imported. Re-do Step 2c.

### Backend won't start — module not found
Make sure your virtual environment is activated:
```bash
source Libmate/backend/.venv/bin/activate   # macOS/Linux
Libmate/backend/.venv\Scripts\activate      # Windows
```

### Mobile app shows "Network Error" or "Could not connect"
1. Make sure the backend (Terminal 1) is running
2. Make sure phone and laptop are on the same WiFi
3. If on university WiFi, try laptop hotspot → connect phone to it → restart `npx expo start`

### Mobile app shows a white screen or crashes
Shake your phone → tap "Reload" in the Expo menu.

### `npm install` fails on the mobile app
```bash
cd Libmate/libmate-mobile
rm -rf node_modules package-lock.json
npm install
```

### Web app shows "Failed to fetch" errors
Make sure the backend is running on port 5000 before loading the web app.

### pip install fails on `cryptography` or `bcrypt`
You're likely on Python 3.13 or 3.14. Switch to Python 3.11 or 3.12:
```bash
# macOS with pyenv:
brew install pyenv
pyenv install 3.12.0
pyenv local 3.12.0
python3 -m venv .venv
```

---

## Test Accounts & Features to Try

| Feature | Where to test |
|---------|--------------|
| Register / Login | Mobile + Web |
| Browse book catalogue | Mobile + Web |
| View book details + reviews | Mobile + Web |
| Add/remove from wishlist | Mobile + Web |
| Reserve a book | Mobile only |
| My borrowings | Mobile + Web |
| Notifications | Mobile + Web |
| Recommendations | Mobile + Web |
| Change password | Mobile + Web |
| Admin dashboard | Web only (admin login) |

---

## What to Report Back to Prince

If something doesn't work, note:
- Which feature (e.g. "wishlist", "reserve book")
- Which platform (mobile / web)
- The exact error message shown on screen or in the terminal
- Steps to reproduce
