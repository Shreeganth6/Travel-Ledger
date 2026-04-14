const tripService = require('../services/tripService');
const { indexTripById } = require('./aiController');

exports.createTrip = async (req, res) => {
  try {
    const creatorId = req.user.user_id;

    const result = await tripService.createTripService(
      req.body,
      creatorId
    );

    // Fire-and-forget: index trip in ChromaDB for RAG
    indexTripById(result.trip_id);

    res.status(201).json({
      success: true,
      data: result,
      message: "Trip created successfully"
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


exports.getTrips = async (req, res) => {
  try {

    const userId = req.user.user_id;

    const trips = await tripService.getTripsService(userId);

    res.status(200).json({
      success: true,
      data: trips
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



exports.getTripById = async (req, res) => {
  try {
    const data = await tripService.getTripByIdService(req.params.tripId);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};


exports.addMember = async (req, res) => {
  try {
    await tripService.addMemberService(
      req.params.tripId,
      req.body.email,
      req.body.name
    );

    res.json({
      success: true,
      message: "Member added successfully"
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
 
exports.updateTripStatus = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const { status } = req.body;

    await tripService.updateTripStatusService(tripId, status);

    res.json({
      success: true,
      message: `Trip status updated to ${status}`
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
 
module.exports = exports;
