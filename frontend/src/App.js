import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthContext } from './context/AuthContext';

import Chat from './pages/Chat.js';
import Login from './pages/Login.js';
import Signup from './pages/Signup.js';

function App() {
    // We get the logged-in user's status from our global context
    const { authUser } = useAuthContext();
    return (
        <>
            <Toaster position="top-center" />
            <Routes>
                {/* If the user is logged in, show the Chat page. Otherwise, redirect to login. */}
                <Route path='/' element={authUser ? <Chat /> : <Navigate to="/login" />} />
                
                {/* If the user is already logged in, redirect them away from login/signup pages. */}
                <Route path='/login' element={authUser ? <Navigate to="/" /> : <Login />} />
                <Route path='/signup' element={authUser ? <Navigate to="/" /> : <Signup />} />
            </Routes>
        </>
    );
}

export default App;