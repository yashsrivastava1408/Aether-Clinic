# MedNexus web app

The React web app for MedNexus. It talks to the Express gateway in `server/` (default `http://localhost:5050`).

## Run it

```bash
npm install
cp .env.example .env   # set VITE_API_URL if the gateway is not on localhost:5050
npm run dev            # http://localhost:5173
```

`npm run lint` checks the code and `npm run build` writes the production build to `dist/`.

## Pages

| Address | File | What it does |
| --- | --- | --- |
| `/`, `/dashboard` | `pages/Dashboard.jsx` | Home page with links to each feature |
| `/consultation` | `pages/Consultation.jsx` | Specialist picker and reply mode (private or fast) |
| `/chatbot/:specialization` | `pages/Chatbot.jsx` | The consultation chat |
| `/report` | `pages/ReportAnalyzer.jsx` | Lab report upload and results |
| `/heart`, `/diabetes` | `pages/HeartRisk.jsx`, `pages/DiabetesRisk.jsx` | Risk forms (both use `components/RiskAssessment.jsx`) |
| `/settings` | `pages/Settings.jsx` | Account, dark mode, health memory |
| `/followup/:token` | `pages/FollowUp.jsx` | The page behind the emailed check-in link |
| `/review` | `pages/Review.jsx` | Clinician review queue (needs the server's reviewer key) |
| `/about` | `pages/About.jsx` | What the app is and how it is built |

## How the chat works

- **Live progress**: the chat calls `POST /api/chat/stream` (`src/utils/chatStream.js`) and shows each step as it happens. The reply arrives once, after the server's safety checks.
- **Numbered sources**: citations are listed as `[1] Title` under the reply.
- **Report context**: after a report is analysed, a short digest is kept in this browser only (`src/utils/reportContext.js`, 30 days) and sent with chat messages so the assessment can take it into account.
- **Report to consultation**: when the report has out-of-range values, a button opens a chat with the suggested specialist and the values ready in the message box.
- **Finished consultations**: a finished consultation is locked. The chat offers a new one and, for signed-in users, an emailed check-in.
- **Clinician review**: while a clinician has the draft, the chat says so and checks for the result every 15 seconds.
- **Consent**: the terms are accepted once per browser session before the first message.

## Layout

`src/components/layout/AppShell.jsx` is the frame around every page: a sidebar on large screens (it can be narrowed to icons, and remembers that), a slide-in drawer on small ones, and a top bar with the page title and the theme switch. The chat page fills the screen and has no footer.

Shared building blocks live in `src/components/ui/`:

- `Modal.jsx`: the dialog used for the legal text, the earlier-consultation prompt and confirmations.
- `Reveal.jsx`: fades a block in the first time it scrolls into view.
- `CountUp.jsx`: counts a number up once (risk percentage, report tiles).

`src/context/FeedbackContext.jsx` gives every page `toast("Saved")` for short messages and `await confirm({ title, text })` for yes/no questions. Use these instead of `alert` and `window.confirm`.

## Styling and motion

Tailwind CSS v4. Colours and shadows are CSS variables in `src/index.css` with a light and a dark set; the `dark` class on `<html>` switches between them (`src/context/ThemeContext.jsx`). Use the token classes (`bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-brand`) and the shared classes (`card`, `btn btn-primary`, `input`, `notice notice-warn`) instead of fixed colours, so both themes stay in step.

Motion classes are in the same file:

| Class | Use |
| --- | --- |
| `fade-in`, `page-enter` | A block or page fading up as it appears |
| `stagger` | Children appear one after another; set `style={{ "--i": index }}` on each child |
| `card-hover`, `icon-tile` | Lift and icon movement on cards that can be clicked |
| `skeleton` | Shimmering placeholder while data loads |
| `typing-dot`, `progress-indeterminate`, `pulse-ring` | Waiting states |

All of it is switched off for people who ask their device to reduce motion.

Icons are inline SVGs in `src/components/Icons.jsx`.

## Stack

React 19, React Router 7, Vite 7, Tailwind CSS 4, axios.
