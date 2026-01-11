# Aether Clinic - Frontend 🛰️

The frontend of Aether Clinic is a high-tech, futuristic web application built with **React** and **Vite**. It focuses on providing a "Professional but Crazy" sci-fi aesthetic with smooth animations and interactive components.

---

## 🚀 Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Vanilla CSS
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Visual Effects**: Canvas-based Neural Maps, Glitch effects, 3D Tilt transforms.
- **State Management**: React Hooks (`useState`, `useEffect`, `useContext`)
- **API Client**: [Axios](https://axios-http.com/)

---

## 🏗️ Core Components

### 1. Holographic Dashboard (`/components/Dashboard`)
-   **HUD Overlay**: A futuristic frame with scrolling data tickers and biometric status displays.
-   **Neural Map**: An interactive HTML5 Canvas visualization of a neural network that responds to mouse movement.
-   **Flashlight Hero**: A mouse-tracking radial gradient reveal effect on the main hero section.
-   **Nano-bot Particles**: Background particle system simulating autonomous medical bots.

### 2. 3D Consultation Carousel (`/components/SpecialistCarousel`)
-   **3D Perspective**: Uses custom geometric calculations to render specialists in a rotation-aware 3D space.
-   **Holographic Cards**: Cards feature frosted glass (Glassmorphism), emerald pulsing borders, and "Status: Active" metadata.

### 3. AI Chatbot ("The Session") (`/components/Chat`)
-   **Command Center Interface**: Designed after military/scientific HUDs.
-   **Glitch Reveal**: AI responses decrypt line-by-line using a character-scrambling effect.
-   **Specialization Modes**: Dynamically updates the AI's "Persona" based on the selected medical field.

### 4. Vision Report Scanner (`/components/ReportScanner`)
-   **Laser Scan Animation**: A moving SVG line that "illuminates" the uploaded document during processing.
-   **OCR Integration**: Extracts and highlights text from images in real-time.
-   **Structured Layout**: Displays findings in a tiled "Data Grid" with severity-color coding (Green/Amber/Crimson).

### 5. Dossier About Page (`/components/About`)
-   **Recorded Feed Aesthetic**: Features top/bottom letterboxing, live timestamp/ID metadata, and subtle camera shake.
-   **Intro-Sequence**: Cinematic logo reveal with sound-design inspiration (visual glitches).

---

## 🎨 Visual System Philosophy

The design adheres to the **"Scientific High-Tech"** aesthetic:
-   **Color Palette**: 
    -   `Obsidian`: `#030303` (Deep Background)
    -   `Emerald`: `#10b981` (Primary Action/Safe)
    -   `Cyan`: `#06b6d4` (Information/HUD)
    -   `Crimson`: `#ef4444` (Alerts/Risks)
-   **Typography**: 
    -   `Monospace` (JetBrains Mono / Inter): Used for all dynamic data to simulate terminal output.
    -   `Bold Sans-Serif`: Used for high-level tactical headers.
-   **Motion**: Every interaction must have a physical response (tilt, scale, or glow).

---

## 🛠️ Setup & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```
