import User from '../models/User.js';

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
        res.status(200).json(allUsers);
    } catch (error) {
        console.error('Error in getUsersForSidebar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const searchUsers = async (req, res) => {
    try {
        // Get the search query from the URL (e.g., /api/users/search?q=john)
        const { q: searchQuery } = req.query;
        const loggedInUserId = req.user._id;

        if (!searchQuery) {
            // If the search query is empty, return all users just like the function above
            const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
            return res.status(200).json(allUsers);
        }

        // Use a case-insensitive regular expression to find matching users
        const searchRegex = new RegExp(searchQuery, 'i');

        const users = await User.find({
            _id: { $ne: loggedInUserId }, // Exclude the current user from search results
            $or: [ // Find a match in either the fullName or the username
                { fullName: { $regex: searchRegex } },
                { username: { $regex: searchRegex } },
            ],
        }).select('-password'); // Exclude password from the result

        res.status(200).json(users);

    } catch (error) {
        console.error('Error in searchUsers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

