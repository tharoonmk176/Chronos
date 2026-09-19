import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "./index.css";
import App from "./App.jsx";
import { RegionProvider } from "./RegionContext.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {" "}
    <Provider store={store}>
      {" "}
      <RegionProvider><App /></RegionProvider>{" "}
    </Provider>{" "}
  </StrictMode>,
);
