
import { adminAuth } from "../config/firebaseAdmin.js";

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await adminAuth.verifyIdToken(token);

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("Firebase authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
}
