# PantryNow (MongoDB + Node.js + Expo)

PantryNow is now a full-stack app:

- Frontend: Expo React Native (in `app/`)
- Backend: Node.js + Express + MongoDB (in `backend/`)
- Authentication: JWT-based login/register
- Data model is user-scoped (products, recipes, ingredients, history)

## 1) Install dependencies

```bash
npm install
npm --prefix backend install
```

## 2) Backend configuration

Create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb+srv://akezhanaskar_db_user:SDoMBEgQVKwIJJ0p@cluster0.s0hurb2.mongodb.net/pantrynow?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=pantrynow_super_secret_change_me
CLIENT_ORIGIN=*
```

## 3) Run backend

```bash
npm run backend:dev
```

## 4) Run mobile app

```bash
npx expo start
```

If needed, set API URL in frontend via:

```env
EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:4000/api
```

`app/lib/api.ts` already has smart defaults for emulator/local usage.

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST/PATCH/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/recipes`
- `POST /api/recipes/:id/cook`
- `GET/POST /api/recipes/:id/ingredients`
- `PUT/DELETE /api/recipe-ingredients/:id`
- `GET /api/history`
