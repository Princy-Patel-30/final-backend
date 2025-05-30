
import { verifyToken} from '../Utils/jwt.js';
export const authenticateToken = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;

  if (!accessToken) {
    if (!refreshToken) {
      return res.status(401).json({ error: 'Access token and refresh token missing' });
    }

    try {
      const refreshResponse = await refreshAccessToken(req, res);
      if (refreshResponse.status !== 200) {
        return res.status(401).json({ error: 'Unable to refresh access token' });
      }
    } catch (_err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  }

  try {
    const { id } = verifyToken(req.cookies.accessToken, 'access');
    req.user = { id };
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
};