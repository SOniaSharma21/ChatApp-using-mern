import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import {Toaster} from "react-hot-toast"
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
const App = () => {
  const { authUser }=useContext(AuthContext)
  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain">
      <Toaster/>
     <Routes>

      <Route path='/' element={authUser?<Homepage/>:<Navigate to="/login"/>}/>
      <Route path='/profile' element={authUser?<Profile/>:<Navigate to="/login"/>}/>
      <Route path='/login' element={!authUser?<Login/>:<Navigate to="/"/>}/>

      </Routes> 
    </div>
  )
}

export default App
