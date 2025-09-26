import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import useAuth from '../../hooks/useAuth';
import '../../styles/Chat.css';

const Navbar = () => {
    const { authUser } = useAuthContext();
    const { logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span style={{color: 'white'}}>💬</span> <span className="text-gradient">Talksy</span>
            </div>
            <div className="navbar-user">
                <div className="avatar navbar-avatar">
                    {authUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="navbar-username">{authUser?.fullName || 'User'}</span>
                <button onClick={logout} className="logout-button">
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;