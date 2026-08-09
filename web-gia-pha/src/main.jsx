import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./index.css";
import App from "./App.jsx";

// Clean up legacy/mock localStorage keys to avoid stale mock data showing in UI
try {
    if (typeof localStorage !== "undefined") {
        localStorage.removeItem("mockFamilies");
        localStorage.removeItem("giapha_mock_persons");
        localStorage.removeItem("giapha_mock_relationships");
    }
} catch (e) {
    // ignore
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>,
);
