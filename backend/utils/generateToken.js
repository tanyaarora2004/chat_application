import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15d',
    });

    res.cookie('jwt', token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        sameSite: 'lax', // Use 'lax' to allow the cookie to be sent on initial cross-site requests
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    });
};

export default generateTokenAndSetCookie;