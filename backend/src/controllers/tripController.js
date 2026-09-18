const Trip = require('../models/Trip');

// ======================================================
// CREATE TRIP
// ======================================================

const createTrip = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const {
      truckId,
      driverId,
      from,
      to,
      startLocation,
      endLocation,
      date,
      tripDate,
      distance,
      status,
      notes,
      partyName,
      freightAmount,
    } = req.body;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: 'From, To and Trip Date are required.',
      });
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip date.',
      });
    }

    const parsedTripDate = tripDate
      ? new Date(tripDate)
      : parsedDate;

    if (Number.isNaN(parsedTripDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip date.',
      });
    }

    const parsedDistance =
      distance === undefined ||
      distance === null ||
      distance === ''
        ? 0
        : Number(distance);

    if (Number.isNaN(parsedDistance) || parsedDistance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid distance.',
      });
    }

    const parsedFreightAmount =
      freightAmount === undefined ||
      freightAmount === null ||
      freightAmount === ''
        ? 0
        : Number(freightAmount);

    if (
      Number.isNaN(parsedFreightAmount) ||
      parsedFreightAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid freight amount.',
      });
    }

    const lastTrip = await Trip.findOne({
      user: userId,
      truck: truckId || undefined,
    }).sort({ tripNumber: -1 });

    const nextTripNumber = lastTrip
      ? lastTrip.tripNumber + 1
      : 1;

    const trip = await Trip.create({
      user: userId,
      tripNumber: nextTripNumber,

      truck: truckId || undefined,
      driver: driverId || undefined,

      from: String(from).trim(),
      to: String(to).trim(),

      startLocation: String(
        startLocation || from
      ).trim(),

      endLocation: String(
        endLocation || to
      ).trim(),

      date: parsedDate,
      tripDate: parsedTripDate,

      distance: parsedDistance,

      status: status || 'scheduled',

      notes: String(notes || '').trim(),

      partyName: String(
        partyName || ''
      ).trim(),

      freightAmount: parsedFreightAmount,

      checklist: {
        chequeReceived: false,
        chequeDeposited: false,
        moneyReceived: false,
      },
    });

    const populatedTrip =
      await Trip.findById(trip._id)
        .populate(
          'truck',
          'registrationNumber vehicleNumber model'
        )
        .populate(
          'driver',
          'name phone licenseNumber'
        );

    return res.status(201).json({
      success: true,
      message: 'Trip created successfully.',
      trip: populatedTrip,
    });
  } catch (error) {
    console.error(
      'Create trip error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to create trip.',
      error: error.message,
    });
  }
};


// ======================================================
// GET ALL TRIPS
// ======================================================

const getTrips = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const filter = {
      user: userId,
    };

    if (req.query.truckId) {
      filter.truck = req.query.truckId;
    }

    const trips = await Trip.find(filter)
      .populate(
        'truck',
        'registrationNumber vehicleNumber model'
      )
      .populate(
        'driver',
        'name phone licenseNumber'
      )
      .sort({
        tripNumber: 1,
      });

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error(
      'Get trips error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load trips.',
      error: error.message,
    });
  }
};


// ======================================================
// GET SINGLE TRIP
// ======================================================

const getTripById = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      user: userId,
    })
      .populate(
        'truck',
        'registrationNumber vehicleNumber model'
      )
      .populate(
        'driver',
        'name phone licenseNumber'
      );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found.',
      });
    }

    return res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error(
      'Get trip error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load trip.',
      error: error.message,
    });
  }
};


// ======================================================
// UPDATE TRIP
// ======================================================

const updateTrip = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found.',
      });
    }

    const {
      truckId,
      driverId,
      from,
      to,
      startLocation,
      endLocation,
      date,
      tripDate,
      distance,
      status,
      notes,
      partyName,
      freightAmount,
    } = req.body;

    if (
      from !== undefined &&
      !String(from).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'From cannot be empty.',
      });
    }

    if (
      to !== undefined &&
      !String(to).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'To cannot be empty.',
      });
    }

    if (from !== undefined) {
      trip.from = String(from).trim();
    }

    if (to !== undefined) {
      trip.to = String(to).trim();
    }

    if (truckId !== undefined) {
      trip.truck = truckId || undefined;
    }

    if (driverId !== undefined) {
      trip.driver = driverId || undefined;
    }

    if (startLocation !== undefined) {
      trip.startLocation =
        String(startLocation).trim();
    }

    if (endLocation !== undefined) {
      trip.endLocation =
        String(endLocation).trim();
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trip date.',
        });
      }

      trip.date = parsedDate;
    }

    if (tripDate !== undefined) {
      const parsedTripDate = new Date(tripDate);

      if (
        Number.isNaN(
          parsedTripDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trip date.',
        });
      }

      trip.tripDate = parsedTripDate;
    }

    if (distance !== undefined) {
      const parsedDistance = Number(distance);

      if (
        Number.isNaN(parsedDistance) ||
        parsedDistance < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid distance.',
        });
      }

      trip.distance = parsedDistance;
    }

    if (status !== undefined) {
      const allowedStatuses = [
        'scheduled',
        'running',
        'completed',
        'cancelled',
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trip status.',
        });
      }

      trip.status = status;
    }

    if (notes !== undefined) {
      trip.notes = String(notes).trim();
    }

    if (partyName !== undefined) {
      trip.partyName =
        String(partyName).trim();
    }

    if (freightAmount !== undefined) {
      const parsedFreightAmount =
        Number(freightAmount);

      if (
        Number.isNaN(parsedFreightAmount) ||
        parsedFreightAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid freight amount.',
        });
      }

      trip.freightAmount =
        parsedFreightAmount;
    }

    // Incremental checklist update.
    // Existing values are preserved.
    if (req.body.checklist !== undefined) {
      const allowedKeys = [
        'chequeReceived',
        'chequeDeposited',
        'moneyReceived',
      ];

      const existingChecklist =
        trip.checklist &&
        typeof trip.checklist.toObject === 'function'
          ? trip.checklist.toObject()
          : (trip.checklist || {});

      const updatedChecklist = {
        ...existingChecklist,
      };

      for (const key of allowedKeys) {
        if (
          req.body.checklist[key] !== undefined
        ) {
          updatedChecklist[key] =
            Boolean(req.body.checklist[key]);
        }
      }

      trip.checklist = updatedChecklist;
    }

    await trip.save();

    const populatedTrip =
      await Trip.findById(trip._id)
        .populate(
          'truck',
          'registrationNumber vehicleNumber model'
        )
        .populate(
          'driver',
          'name phone licenseNumber'
        );

    return res.status(200).json({
      success: true,
      message: 'Trip updated successfully.',
      trip: populatedTrip,
    });
  } catch (error) {
    console.error(
      'Update trip error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to update trip.',
      error: error.message,
    });
  }
};


// ======================================================
// UPDATE TRIP STATUS
// ======================================================

const updateTripStatus = async (
  req,
  res
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const {
      status,
    } = req.body;

    const allowedStatuses = [
      'scheduled',
      'running',
      'completed',
      'cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip status.',
      });
    }

    const trip =
      await Trip.findOneAndUpdate(
        {
          _id: req.params.id,
          user: userId,
        },
        {
          status,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          'truck',
          'registrationNumber vehicleNumber model'
        )
        .populate(
          'driver',
          'name phone licenseNumber'
        );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Trip status updated successfully.',
      trip,
    });
  } catch (error) {
    console.error(
      'Update trip status error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to update trip status.',
      error: error.message,
    });
  }
};


// ======================================================
// UPDATE CHECKLIST
// ======================================================

const updateTripChecklist = async (
  req,
  res
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const allowedKeys = [
      'chequeReceived',
      'chequeDeposited',
      'moneyReceived',
    ];

    const checklist = {};

    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        checklist[key] =
          Boolean(req.body[key]);
      }
    }

    const trip =
      await Trip.findOne({
        _id: req.params.id,
        user: userId,
      });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found.',
      });
    }

    // Merge instead of replacing.
    // This preserves previous checklist progress.
    const existingChecklist =
      trip.checklist &&
      typeof trip.checklist.toObject === 'function'
        ? trip.checklist.toObject()
        : (trip.checklist || {});

    trip.checklist = {
      ...existingChecklist,
      ...checklist,
    };

    await trip.save();

    const populatedTrip =
      await Trip.findById(trip._id)
        .populate(
          'truck',
          'registrationNumber vehicleNumber model'
        )
        .populate(
          'driver',
          'name phone licenseNumber'
        );

    return res.status(200).json({
      success: true,
      message:
        'Trip checklist updated successfully.',
      trip: populatedTrip,
    });
  } catch (error) {
    console.error(
      'Update checklist error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to update trip checklist.',
      error: error.message,
    });
  }
};


// ======================================================
// DELETE TRIP
// ======================================================

const deleteTrip = async (
  req,
  res
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const trip =
      await Trip.findOneAndDelete({
        _id: req.params.id,
        user: userId,
      });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Trip deleted successfully.',
    });
  } catch (error) {
    console.error(
      'Delete trip error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to delete trip.',
      error: error.message,
    });
  }
};


module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  updateTripStatus,
  updateTripChecklist,
  deleteTrip,
};