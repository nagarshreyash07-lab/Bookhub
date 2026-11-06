export function verifyAdmin(req, res, next) {
  const ADMIN_UIDS = (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((uid) => uid.trim())
    .filter(Boolean);

  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  if (!ADMIN_UIDS.includes(req.user.uid)) {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
}