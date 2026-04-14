const db = require('../config/db');

exports.checkTripMember = async (req, res, next) => {
  try {
    const tripId = req.params.tripId || req.body.trip_id;
    const userId = req.user.user_id;

    const [rows] = await db.query(
      `SELECT role FROM Trip_Members 
       WHERE trip_id = ? AND user_id = ?`,
      [tripId, userId]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a trip member."
      });
    }

    req.user.role = rows[0].role;

    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
