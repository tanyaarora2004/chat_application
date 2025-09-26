import React, { useState } from 'react';
// import useAuth from '../../hooks/useAuth'; // You would create this hook to handle the logic

const AuthForm = ({ isLogin }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // const { login, signup } = useAuth(); // Example of using your custom hook

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            // login(formData.username, formData.password);
            console.log('Logging in with:', formData.username, formData.password);
        } else {
            // signup(formData);
            console.log('Signing up with:', formData);
        }
    };

    const handleGoogleAuth = () => {
        // Redirects the user to the backend route to initiate Google OAuth
        window.location.href = 'http://localhost:5000/api/auth/google';
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        onChange={handleChange}
                        required
                    />
                )}
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    onChange={handleChange}
                    required
                />
                 {!isLogin && (
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                        required
                    />
                )}
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                />
                {!isLogin && (
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        onChange={handleChange}
                        required
                    />
                )}
                <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>
            </form>
            <hr />
            <button onClick={handleGoogleAuth}>
                {isLogin ? 'Log In with Google' : 'Sign Up with Google'}
            </button>
        </div>
    );
};

export default AuthForm;