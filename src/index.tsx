import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './index.scss';
import './i18n/config'; // Initialize i18n
import App from './App';
import reportWebVitals from './reportWebVitals';

// Set HTML lang attribute based on user preference
try {
  const storedUser = localStorage.getItem("papyrusai_user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    const language = user["custom:language"];
    const languageCode = language === "spanish" ? "es" : "en";
    document.documentElement.setAttribute("lang", languageCode);
  }
} catch (error) {
  console.error("Error setting language attribute:", error);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
