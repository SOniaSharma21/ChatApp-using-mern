import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx' 
import './index.css'; // VERY IMPORTANT
import { ChatProvider } from '../context/ChatContext.jsx'
 // check path carefully

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider> <App /></ChatProvider>
       
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
