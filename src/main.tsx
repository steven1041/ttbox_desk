import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// 确保根元素应用了全局样式
const root = document.getElementById("root") as HTMLElement;
if (root) {
  root.classList.add(
    "h-screen",
    "bg-background-dark",
    "font-sans",
    "text-text-dark-primary",
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
