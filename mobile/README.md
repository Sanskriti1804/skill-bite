# SkillBite mobile (Expo / React Native)

Learner mobile app for Android and iOS. Creator publishing and Admin stay on the Next.js web app.

## Run

Start the API first (`backend/` on port 3000).

```text
cd mobile
npm install
npm start
```

Then press `a` for Android emulator or `i` for iOS simulator.

- Android emulator reaches the host API at `http://10.0.2.2:3000`
- iOS simulator uses `http://127.0.0.1:3000`
- Physical devices need your machine LAN IP in `src/api.ts`

## Screens

Bottom tabs (icons): Learn, Saved, History, Alerts, You. Learn is a vertical short-lesson feed. Watch is immersive with save/share actions and course outline. Icons live in `src/icons.tsx` (`@expo/vector-icons`).
