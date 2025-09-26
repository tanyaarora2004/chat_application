import React, { useEffect, useState } from 'react';
import apiClient from '../../api/api.js';
import toast from 'react-hot-toast';
import Conversation from './Conversation.js';
import '../../styles/Chat.css';

// Search Icon component
const SearchIcon = () => (
    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);


const Sidebar = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(""); // State for the search input

    // This useEffect hook now handles the search logic.
    // It runs automatically whenever the searchQuery changes, after a short delay.
    useEffect(() => {
        const searchUsers = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/users/search?q=${searchQuery}`);
                setUsers(res.data);
                if (res.data.length === 0 && searchQuery) {
                    toast.success("No users found.");
                }
            } catch (error) {
                toast.error("Search failed.");
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get('/users');
                setUsers(res.data);
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast.error("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };

        // This is the debounce mechanism. It waits 500ms after the user stops typing.
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchUsers();
            } else {
                fetchAllUsers(); // If search bar is cleared, show all users again
            }
        }, 500); // 500ms delay

        // This cleanup function cancels the timer if the user types again within the delay period.
        return () => clearTimeout(timer);

    }, [searchQuery]); // The effect re-runs whenever the searchQuery state changes

    return (
        <div className="sidebar">
            {/* Search input container */}
            <div className="sidebar-header">
                <div className="search-container">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="user-list">
                {users.map(user => (
                    <Conversation key={user._id} user={user} />
                ))}
                {loading && <div className="loading-indicator">Loading...</div>}
            </div>
        </div>
    );
};

export default Sidebar;