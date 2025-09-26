import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import apiClient from '../api/api.js';

const useAuth = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();
	const navigate = useNavigate();

	const signup = async (formData) => {
		setLoading(true);
		try {
			const res = await apiClient.post("/auth/signup", formData);
			localStorage.setItem("chat-user", JSON.stringify(res.data));
			setAuthUser(res.data);
			toast.success("Account created successfully!");
			navigate("/"); // Redirect to chat page
		} catch (error) {
			toast.error(error.response?.data?.error || "Signup failed");
		} finally {
			setLoading(false);
		}
	};

	const login = async (username, password) => {
		setLoading(true);
		try {
			const res = await apiClient.post("/auth/login", { username, password });
			localStorage.setItem("chat-user", JSON.stringify(res.data));
			setAuthUser(res.data);
			toast.success("Logged in successfully!");
			navigate("/"); // Redirect to chat page
		} catch (error) {
			toast.error(error.response?.data?.error || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		setLoading(true);
		try {
			await apiClient.post("/auth/logout");
			localStorage.removeItem("chat-user");
			setAuthUser(null);
		} catch (error) {
			toast.error(error.response?.data?.error || "Logout failed");
		} finally {
			setLoading(false);
		}
	};

	return { loading, signup, login, logout };
};

export default useAuth;