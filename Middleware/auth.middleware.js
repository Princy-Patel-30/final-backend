  import { verifyToken } from '../Utils/jwt.js';
  import { refreshAccessTokenService } from '../services/authService.js';

  export const authenticateToken = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    try {
      // Attempt to verify the existing access token
      const { id } = verifyToken(accessToken, 'access');
      req.user = { id };
      return next();
    } catch (_err) {
      // Access token is missing or invalid; try refreshing it
      if (!refreshToken) {
        return res.status(401).json({ error: 'Access token and refresh token missing' });
      }

      try {
        // Generate a new access token using the refresh token
        const newAccessToken = await refreshAccessTokenService(refreshToken);
        // Set the new access token in the response cookies
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 1000 * 60 * 15, // 15 minutes
        });
        // Verify the new access token
        const { id } = verifyToken(newAccessToken, 'access');
        req.user = { id };
        return next();
      } catch (refreshErr) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }
    }
  };