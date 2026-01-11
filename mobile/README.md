# Aether Clinic - Mobile 📱

The mobile companion for Aether Clinic, built with **React Native** and **Expo**. It provides a streamlined, portable version of the medical intelligence system with optimized biometric-style UI.

---

## 🚀 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 50+)
- **Runtime**: [React Native](https://reactnative.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Animations**: Reanimated & Lucide Icons for high-performance UI feedback.

---

## ✨ Features

- **Analyze Tab**: Mobile-optimized interface for uploading clinical reports directly from the camera or photo library.
- **Biometric UI**: Circular progress indicators and holographic typography that mimics medical diagnostic hardware.
- **Neural Sync**: Seamlessly interfaces with the Node.js backend to provide AI insights on the go.
- **Responsive Layout**: Designed for both iOS and Android with tactical HUD frames.

---

## 🏗️ Project Structure

- `app/`: Contains the main screens using Expo Router.
  - `(tabs)/`: Main bottom-tab navigation (Home, Analyze, Profile).
  - `_layout.tsx`: Root layout with theme providers and font loading.
- `components/`: Pure UI components like `AnalyzeScreen`, `HolographicButton`, etc.
- `constants/`: Theme colors and configuration.
- `hooks/`: Custom React hooks for API calls and device permissions.

---

## 🛠️ Setup & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Backend URL**
   - Update the API base URL in `constants/Config.ts` (or equivalent) to point to your development machine's IP address.

3. **Start the app**
   ```bash
   npx expo start
   ```

4. **Run on Device/Emulator**
   - Press `i` for iOS simulator.
   - Press `a` for Android emulator.
   - Scan the QR code with the **Expo Go** app on your physical device.

---

## 🎨 Visual Identity
The mobile app maintains the same **Emerald & Obsidian** aesthetic as the web version but uses simplified motion to ensure 60FPS performance on mobile hardware.
