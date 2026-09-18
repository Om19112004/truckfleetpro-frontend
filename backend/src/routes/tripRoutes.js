const express = require('express');

const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  updateTripStatus,
  updateTripChecklist,
  deleteTrip,
} = require('../controllers/tripController');

const protect = require('../middleware/authMiddleware');

const router = express.Router();

// ======================================================
// CREATE TRIP
// ======================================================

router.post(
  '/',
  protect,
  createTrip
);

// ======================================================
// GET ALL TRIPS
// Optional: ?truckId=TRUCK_ID
// ======================================================

router.get(
  '/',
  protect,
  getTrips
);

// ======================================================
// GET SINGLE TRIP
// ======================================================

router.get(
  '/:id',
  protect,
  getTripById
);

// ======================================================
// UPDATE TRIP
// Basic details + optional diesel/payment/checklist
// ======================================================

router.put(
  '/:id',
  protect,
  updateTrip
);

// ======================================================
// UPDATE TRIP STATUS
// ======================================================

router.patch(
  '/:id/status',
  protect,
  updateTripStatus
);

// ======================================================
// UPDATE TRIP CHECKLIST
// ======================================================

router.patch(
  '/:id/checklist',
  protect,
  updateTripChecklist
);

// ======================================================
// DELETE TRIP
// ======================================================

router.delete(
  '/:id',
  protect,
  deleteTrip
);

module.exports = router;