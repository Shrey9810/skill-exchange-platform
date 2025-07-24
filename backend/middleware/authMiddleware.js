const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get token from the 'x-auth-token' header
    const token = req.header('x-auth-token');

    // 2. Check if no token is present
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // 3. Verify the token if it exists
    try {
        // Decode the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the user payload from the token to the request object
        req.user = decoded.user;
        
        // Pass control to the next middleware or route handler
        next();
    } catch (err) {
        // If the token is not valid (e.g., expired or malformed), send an error response
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
