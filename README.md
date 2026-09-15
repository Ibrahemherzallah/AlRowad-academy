# اكاديمية الرواد — Rawad Academy Platform

Palestinian education platform: in-person recorded courses, student portal, admin control center. Income-focused, entrepreneurial, RTL-first (Arabic + English).

## Stack

| Layer     | Tech                                                             |
| --------- | --------------------------------------------------------------- |
| Frontend  | React + TypeScript + Vite, Tailwind, Framer Motion, shadcn/ui    |
| i18n      | react-i18next (ar/en, full RTL)                                  |
| Backend   | Node.js + TypeScript + Express                                   |
| Database  | MongoDB + Mongoose                                               |
| Auth      | JWT access + refresh (httpOnly cookie)                           |

## Structure

```
rawad-academy/
├── package.json          # npm workspaces root
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── components/    # UI + layout (Navbar, Footer, theme, ui/)
│   │   ├── pages/         # Route pages
│   │   ├── lib/           # api client, utils
│   │   ├── i18n/          # react-i18next config + locales
│   │   ├── providers/     # Theme, Auth, Direction
│   │   ├── store/         # zustand stores
│   │   └── routes/        # router config
│   └── ...
└── server/               # Express API
    └── src/
        ├── config/        # env, db
        ├── models/        # Mongoose models
        ├── controllers/   # route handlers
        ├── routes/        # express routers
        ├── middleware/    # auth, error, rate-limit, validate
        ├── services/      # business logic (loyalty, offers, notify)
        ├── utils/         # tokens, apiError, catchAsync
        └── types/         # shared TS types
```

## Getting started

```bash
npm install                 # installs both workspaces
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run dev                 # runs server + client concurrently
```

Server: http://localhost:5000 — Client: http://localhost:5173

## Delivery phases

- **Phase 1 (MVP):** public site, auth, student portal + video access control, admin course/student/enrollment, coupons + bundles, loyalty points, WhatsApp on enroll.
- **Phase 2:** referrals, group reward, 1:1 sessions, certificates, waitlist, installments, leaderboard.
- **Phase 3:** analytics, blog, community Q&A, CMS, perf, full RTL polish.
