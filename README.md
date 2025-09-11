# Workout Tracker (Expo + React Native)

An Expo Router app for browsing exercises, viewing details, and creating your own custom exercises locally. Built with React Native 0.79 and React 19, featuring modern UI components, typed routes, and local persistence via AsyncStorage.

## Features

- Browse exercises with search and debounced filtering
- View exercise details, instructions, target and secondary muscles, and equipment
- Create local/custom exercises (stored in AsyncStorage) with placeholder avatars
- Tab navigation: Profile, History, Workouts, Exercises
- Custom header with search, context menu, and platform-friendly UX
- Light/Dark theme support via React Navigation themes

## Tech Stack

- Expo 53, Expo Router 5 (file-based routing)
- React 19, React Native 0.79
- React Navigation 7, Reanimated 3, Gesture Handler 2
- TypeScript (strict), path alias `@/*`
- AsyncStorage for local data persistence
- `expo-image` for performant images

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Start the development server

```bash
npm run start
```

Then choose one of:

- Android Emulator: `a` in the terminal or `npm run android`
- iOS Simulator (macOS): `i` in the terminal or `npm run ios`
- Web: `w` in the terminal or `npm run web`

Requirements: Recent Node LTS, Expo CLI (managed via npx), Android Studio/Xcode if running emulators/simulators.

## Scripts

- `npm run start`: Start Expo dev server
- `npm run android`: Launch on Android
- `npm run ios`: Launch on iOS
- `npm run web`: Launch web build
- `npm run lint`: Run ESLint (configured via `eslint.config.js`)
- `npm run reset-project`: Clear starter example (from template)

## App Structure

```
app/
  _layout.tsx                Root stack and theme provider
  (tabs)/
    _layout.tsx              Bottom tab navigation
    profile.tsx              Placeholder screen
    history.tsx              Placeholder screen
    workouts.tsx             Placeholder screen
    exercises.tsx            Exercise list + search + navigation
  exercise/
    [exerciseId].tsx         Exercise detail screen
    create.tsx               Create custom exercise (local)
components/
  CustomHeader.tsx           Header with search and menu
  MultiSelectModal.tsx       Reusable modal for selecting values
  ThemedText.tsx, ThemedView.tsx, ui/*, etc.
services/
  exerciseService.ts         Remote fetch + local storage helpers
```

Routing uses Expo Router with typed routes (`app.json` enables `experiments.typedRoutes`). The entry is `expo-router/entry` set in `package.json`.

## Data and Persistence

- Remote data: Exercises fetched from `https://exercisedb-api-psi.vercel.app/api/v1`
- Local data: Custom exercises saved to AsyncStorage under key `custom_exercises_v1`
- Merging: Local results are merged with remote and de-duplicated by `exerciseId`

## Notable Components

- `CustomHeader`: Back button, title, debounced search, and an overflow menu (via `@appandflow/expo-context-menu` or a simple menu on tap)
- `MultiSelectModal`: Select single/multiple muscles with optional “None”
- `HapticTab` and custom TabBar background for polished tab UX

## Theming

`app/_layout.tsx` applies `DarkTheme` or `DefaultTheme` based on `useColorScheme`. Fonts are loaded with `expo-font` and bundled from `assets/fonts`.

## TypeScript

`tsconfig.json` extends Expo’s base and sets strict type-checking. Path alias `@/*` points to the project root for concise imports.

## Troubleshooting

- If images don’t appear, ensure network access for the simulator/emulator
- If local custom exercises don’t show, verify storage permissions and try reinstalling the app to clear caches
- iOS simulators may require a clean build if native modules were updated

## Firebase setup (Auth + Firestore)

1. Create a project in the Firebase Console and enable Authentication (Email/Password) and Firestore.
2. In Project Settings → General, add iOS, Android, and Web apps to your project to obtain config.
3. Copy your Web config values into Expo env vars in a `.env` file at the project root:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
   - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
4. Firestore rules (development example):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Restart the dev server after adding env vars. For native changes, rebuild dev client.
