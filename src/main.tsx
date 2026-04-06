import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Save current URL for WebView session recovery
window.addEventListener("beforeunload", () => {
  sessionStorage.setItem("lastUrl", window.location.pathname + window.location.search);
});

// Restore URL if WebView reloaded unexpectedly (e.g., after file picker)
const lastUrl = sessionStorage.getItem("lastUrl");
if (lastUrl && lastUrl !== "/" && window.location.pathname === "/") {
  sessionStorage.removeItem("lastUrl");
  window.history.replaceState(null, "", lastUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
