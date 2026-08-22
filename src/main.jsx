import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/selasar-ui.css'
import './styles/pos-delivero.css'
import './styles/login-cinematic.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => registration.update())
      .catch((error) => {
        console.warn('Service worker Selasar tidak dapat didaftarkan.', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
