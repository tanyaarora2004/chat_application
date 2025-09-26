import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/api";

export const AuthContext = createContext();
export const useAuthContext = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
	const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem("chat-user")) || null);
	const [loading, setLoading] = useState(true);

	// Check authentication status on app load
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				// If user is already in localStorage, we're good
				if (authUser) {
					setLoading(false);
					return;
				}

				// Check if user is authenticated via cookie (for Google OAuth)
				const response = await apiClient.get('/auth/me');
				if (response.data) {
					setAuthUser(response.data);
					localStorage.setItem("chat-user", JSON.stringify(response.data));
				}
			} catch (error) {
				// User not authenticated, that's fine
				console.log('User not authenticated');
			} finally {
				setLoading(false);
			}
		};

		checkAuthStatus();
	}, [authUser]);

	return (
		<AuthContext.Provider value={{ authUser, setAuthUser, loading }}>
			{children}
		</AuthContext.Provider>
	);
};