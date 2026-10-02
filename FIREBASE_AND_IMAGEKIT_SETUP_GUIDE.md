# Rathore Heritage Developers — Static GitHub Pages + Firebase + ImageKit Setup Guide

This guide details the **zero-server static architecture** designed for **GitHub Pages**, utilizing:
- **Firebase Authentication** for secure Admin Login
- **Firebase Cloud Firestore** for dynamic content, projects, craftsmanship cards & enquiries
- **ImageKit** for global CDN image storage, automatic WebP/AVIF compression & transformations
- **GitHub Pages** for 100% free static frontend hosting

---

## 🏛️ Architecture Overview

```text
GitHub Pages (Static Hosting)
    │
    ├── Main Website (index.html)
    │        │
    │        ├── Database Service (js/database.js) ────────────► Firebase Cloud Firestore
    │        │                                                   (Content, Projects, Enquiries)
    │        └── Global CDN Media Delivery ────────────────────► ImageKit CDN
    │                                                            (https://ik.imagekit.io/...)
    │
    └── Admin Panel (/admin/index.html)
             │
             ├── Secure Authentication (admin/js/auth.js) ─────► Firebase Auth (Email/Password)
             ├── Content Management (admin/js/database.js) ────► Firebase Cloud Firestore
             └── Media Uploads & Storage (js/imagekit-service) ► ImageKit API
                                                                 (https://upload.imagekit.io/api/v1/files/upload)
```

- **Zero Custom Servers**: No Node.js, Express, Render, or `localhost:5000` required at runtime.
- **Client-Safe Credentials**: Only public keys are stored in source code.
- **Private Key Security**: Your ImageKit Private Key is stored strictly on your local browser machine (`localStorage`), never committed to GitHub or exposed to public visitors.

---

## 1. ImageKit Setup (Image Storage & CDN)

### Step 1: Create Free ImageKit Account
1. Go to [https://imagekit.io/registration](https://imagekit.io/registration) and sign up for a free plan (20 GB bandwidth/month free).
2. Complete your registration and log in to the dashboard.

### Step 2: Get Your API Keys
1. In the ImageKit Dashboard left sidebar, click **Developer options** > **API keys** (or go to [https://imagekit.io/dashboard/developer/api-keys](https://imagekit.io/dashboard/developer/api-keys)).
2. You will see:
   - **Public Key** (starts with `public_...`)
   - **Private Key** (starts with `private_...`)
   - **URL-endpoint** (e.g. `https://ik.imagekit.io/your_id/`)

### Step 3: Configure Frontend
1. Open `imagekit-config.js` (and `admin/imagekit-config.js`) and paste your **Public Key** and **URL-endpoint**:
   ```javascript
   const IMAGEKIT_CONFIG = {
     publicKey: "public_YOUR_PUBLIC_KEY",
     urlEndpoint: "https://ik.imagekit.io/your_imagekit_id/",
   };
   ```
   *(These two values are public identifiers and safe to commit to GitHub).*

2. Open the Admin Panel (`/admin/`), navigate to **ImageKit Media Library**, and click **ImageKit Setup**:
   - Paste your **Private Key** (starts with `private_...`).
   - Click **Save ImageKit Config**.
   - Your Private Key is stored strictly in your browser's private `localStorage` on that device. It signs uploads on-the-fly using standard WebCrypto (HMAC-SHA1) without any backend server.

---

## 2. Firebase Setup (Authentication & Firestore)

Your project configuration is already added to `firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAcFhTxCk99es7fMGnNpXK_ydGYcnaYbuY",
  authDomain: "heritage-20bb8.firebaseapp.com",
  projectId: "heritage-20bb8",
  storageBucket: "heritage-20bb8.firebasestorage.app",
  messagingSenderId: "530942849404",
  appId: "1:530942849404:web:ac90779f0d6082c30cb4f9",
  measurementId: "G-17SPJCBTMT"
};
```

### Step 1: Enable Email/Password Auth
1. Go to [Firebase Console](https://console.firebase.google.com/project/heritage-20bb8) > **Build** > **Authentication**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Under **Users**, click **Add user**:
   - **Email**: `admin@rathoreheritage.com`
   - **Password**: `Admin@123456` (or your chosen password)

### Step 2: Enable Cloud Firestore
1. In Firebase Console, go to **Build** > **Firestore Database** > **Create database**.
2. Select `asia-south1 (Mumbai)` and start in **Production mode**.
3. Under the **Rules** tab, paste the following rules and click **Publish**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Website content: public read; authenticated admin write
       match /{collection}/{docId} {
         allow read: if true;
         allow write: if request.auth != null;
       }

       // Client enquiries: public create; authenticated admin manage
       match /enquiries/{enquiryId} {
         allow create: if true;
         allow read, update, delete: if request.auth != null;
       }

       // Audit logs: authenticated admin only
       match /auditLogs/{logId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

---

## 3. Populate All Content (1-Click)

1. Open `/admin/` in your browser.
2. Log in with your admin credentials.
3. On the **Dashboard**, click the **"Seed / Reset Cloud Content"** button.
4. All 12 sections, projects (Oladar Haveli, Roop Mahal, etc.), craftsmanship cards (10 cards), materials (M1-M8), raw materials, darbar slides, and services will be written directly into Cloud Firestore in seconds.

---

## 4. Deploying to GitHub Pages

1. Commit and push your code to GitHub:
   ```bash
   git add .
   git commit -m "Configure Firebase and ImageKit for static GitHub Pages"
   git push origin main
   ```

2. Enable GitHub Pages:
   - In your GitHub repo, go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select Branch: `main` and folder: `/ (root)`.
   - Click **Save**.

3. Your live URLs:
   - **Public Website**: `https://<your-username>.github.io/<repo-name>/`
   - **Admin Portal**: `https://<your-username>.github.io/<repo-name>/admin/`
