# AI Agent Instructions for Workout Tracker App

This document provides guidance for AI coding agents to effectively contribute to this Expo-based workout tracker application.

## 1. Core Architecture & Tech Stack

- **Framework**: Expo SDK 53, React Native 0.79, React 19.
- **Routing**: Expo Router 5 (file-based). New routes are created by adding files to the `app/` directory. Typed routes are enabled (`experiments.typedRoutes` in `app.json`).
- **Language**: TypeScript (strict). Use path aliases `@/*` for imports from the root directory.
- **UI & Theming**:
  - Uses React Navigation for navigation structure.
  - Custom components like `ThemedText` and `ThemedView` should be used for UI elements to support light/dark mode.
  - Colors are managed via `constants/Colors.ts` and the `useThemeColor` hook.
  - Icons are from `@expo/vector-icons` and `expo-symbols`.

## 2. File-based Routing with Expo Router

- **Pages**: Add new files to the `app/` directory to create new screens. For example, `app/settings.tsx` creates a `/settings` route.
- **Layouts**: The `(tabs)` directory is a route group for the main tab navigation, configured in `app/(tabs)/_layout.tsx`.
- **Dynamic Routes**: The app uses dynamic routes for detail screens, such as `app/exercise/[exerciseId].tsx`.
- **Navigation**: Use the `<Link>` component or the `router` object from `expo-router` for navigation.

## 3. Data Management & Services

This project combines remote data, local storage, and Firebase services.

- **Remote Data**: Exercise data is fetched from `https://exercisedb-api-psi.vercel.app/api/v1`. The logic is encapsulated in `services/exerciseService.ts`.
- **Local Data**: Custom exercises are stored locally using AsyncStorage. The key is `custom_exercises_v1`. `services/exerciseService.ts` also contains helpers for this.
- **Firebase**:
  - **Authentication**: User authentication is handled via Firebase. See `context/AuthContext.tsx` and `services/firebase.ts`.
  - **DataConnect**: The `dataconnect/` directory and `firebase.json` indicate the use of Firebase DataConnect for backend logic. Schema is defined in `dataconnect/schema/schema.gql`.

When adding features, check if data should be fetched remotely, stored locally, or managed through Firebase.

## 4. State Management

- **Authentication**: The user's authentication state is managed globally by `AuthContext`.
- **Workout Sessions**: The state of an active workout is managed by `WorkoutSessionContext`. Use this context to access or modify the current workout session.

## 5. Developer Workflow

- **Start Development Server**: `npm run start`
- **Run on Emulators**: `npm run ios` or `npm run android`
- **Linting**: `npm run lint`. Ensure code is linted before committing.

## 6. Key Components

- **`components/CustomHeader.tsx`**: A reusable header with a back button, title, debounced search, and a context menu. Use this for a consistent look and feel on screens.
- **`components/MultiSelectModal.tsx`**: A modal for selecting multiple items from a list.
- **`components/ui/`**: Contains platform-specific UI enhancements like `IconSymbol.ios.tsx`.

When creating new UI, first check if a suitable component already exists in the `components/` directory.
