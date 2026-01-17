import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";   // ✅ THIS must exist

import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById("root")).render(
    <GoogleOAuthProvider clientId="232387421317-g9voesm803hp5qhbb20jeu6ue2dr661h.apps.googleusercontent.com">
        <App />
    </GoogleOAuthProvider>
);