const Truck = require('../models/Truck');
const Driver = require('../models/Driver');

// ==========================================
// CREATE TRUCK
// ==========================================

const createTruck = async (req, res) => {
  try {
    const {
      registrationNumber,
      make,
      model,
      year,
      truckType,
      capacity,
      address,

      // Document expiry dates
      fitnessExpiry,
      taxExpiry,
      insuranceExpiry,
      puccExpiry,
      permitExpiry,
      nationalPermitExpiry,
    } = req.body;

    // Only registration number and capacity are required
    if (!registrationNumber || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Registration number and capacity are required',
      });
    }

    const normalizedRegistration =
      String(registrationNumber).trim().toUpperCase();

    if (!normalizedRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required',
      });
    }

    const numericCapacity = Number(capacity);

    if (!Number.isFinite(numericCapacity) || numericCapacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a valid positive number',
      });
    }

    const existingTruck = await Truck.findOne({
      registrationNumber: normalizedRegistration,
    });

    if (existingTruck) {
      return res.status(409).json({
        success: false,
        message: 'A truck with this registration number already exists',
      });
    }

    const truck = await Truck.create({
      owner: req.userId,

      registrationNumber: normalizedRegistration,

      make: make?.trim() || '',

      model: model?.trim() || '',

      year:
        year !== undefined && year !== ''
          ? Number(year)
          : undefined,

      truckType: truckType?.trim() || '',

      capacity: numericCapacity,

      address: address?.trim() || '',

      // Document expiry dates
      fitnessExpiry: fitnessExpiry || null,
      taxExpiry: taxExpiry || null,
      insuranceExpiry: insuranceExpiry || null,
      puccExpiry: puccExpiry || null,
      permitExpiry: permitExpiry || null,
      nationalPermitExpiry: nationalPermitExpiry || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Truck created successfully',
      truck,
    });
  } catch (error) {
    console.error('Create truck error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create truck',
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL TRUCKS
// ==========================================

const getTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find({
      owner: req.userId,
    })
      .populate(
        'driver',
        'name phone licenseNumber licenseExpiry status'
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trucks.length,
      trucks,
    });
  } catch (error) {
    console.error('Get trucks error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trucks',
    });
  }
};

// ==========================================
// UPDATE TRUCK
// PATCH /api/trucks/:id
// ==========================================

const updateTruck = async (req, res) => {
  try {
    const userId = req.userId;
    const truckId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const {
      registrationNumber,
      make,
      model,
      year,
      truckType,
      capacity,
      address,
      status,

      // Document expiry dates
      fitnessExpiry,
      taxExpiry,
      insuranceExpiry,
      puccExpiry,
      permitExpiry,
      nationalPermitExpiry,
    } = req.body;

    const updates = {};

    // ==========================================
    // BASIC TRUCK DETAILS
    // ==========================================

    if (registrationNumber !== undefined) {
      const normalizedRegistration = String(
        registrationNumber
      )
        .trim()
        .toUpperCase();

      if (!normalizedRegistration) {
        return res.status(400).json({
          success: false,
          message: 'Registration number cannot be empty',
        });
      }

      const duplicateTruck = await Truck.findOne({
        registrationNumber: normalizedRegistration,
        _id: {
          $ne: truckId,
        },
      });

      if (duplicateTruck) {
        return res.status(409).json({
          success: false,
          message:
            'A truck with this registration number already exists',
        });
      }

      updates.registrationNumber =
        normalizedRegistration;
    }

    if (make !== undefined) {
      updates.make = String(make).trim();
    }

    if (model !== undefined) {
      updates.model = String(model).trim();
    }

    if (truckType !== undefined) {
      updates.truckType = String(truckType).trim();
    }

    if (year !== undefined && year !== '') {
      const numericYear = Number(year);

      if (!Number.isFinite(numericYear)) {
        return res.status(400).json({
          success: false,
          message: 'Year must be a valid number',
        });
      }

      updates.year = numericYear;
    }

    if (capacity !== undefined) {
      const numericCapacity = Number(capacity);

      if (
        !Number.isFinite(numericCapacity) ||
        numericCapacity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Capacity must be a valid positive number',
        });
      }

      updates.capacity = numericCapacity;
    }

    if (address !== undefined) {
      updates.address = String(address).trim();
    }

    // ==========================================
    // DOCUMENT EXPIRY DATES
    // ==========================================

    const documentDates = {
      fitnessExpiry,
      taxExpiry,
      insuranceExpiry,
      puccExpiry,
      permitExpiry,
      nationalPermitExpiry,
    };

    Object.entries(documentDates).forEach(
      ([field, value]) => {
        if (value !== undefined) {
          if (value === null || value === '') {
            updates[field] = null;
            return;
          }

          const parsedDate = new Date(value);

          if (Number.isNaN(parsedDate.getTime())) {
            throw new Error(
              `Invalid ${field} date`
            );
          }

          updates[field] = parsedDate;
        }
      }
    );

    // ==========================================
    // STATUS
    // ==========================================

    if (status !== undefined) {
      const allowedStatuses = [
        'available',
        'on_trip',
        'maintenance',
        'inactive',
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid truck status',
        });
      }

      updates.status = status;
    }

    // ==========================================
    // NOTHING TO UPDATE
    // ==========================================

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No truck details were provided for update',
      });
    }

    // ==========================================
    // UPDATE DATABASE
    // ==========================================

    const truck = await Truck.findOneAndUpdate(
      {
        _id: truckId,
        owner: userId,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate(
      'driver',
      'name phone licenseNumber licenseExpiry status'
    );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Truck updated successfully',
      truck,
    });
  } catch (error) {
    console.error(
      'Update truck error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to update truck',
      error: error.message,
    });
  }
};

// ==========================================
// DELETE TRUCK
// ==========================================

const deleteTruck = async (req, res) => {
  try {
    const userId = req.userId;
    const truckId = req.params.id;

    const truck =
      await Truck.findOneAndDelete({
        _id: truckId,
        owner: userId,
      });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Truck deleted successfully',
    });
  } catch (error) {
    console.error(
      'Delete truck error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to delete truck',
      error: error.message,
    });
  }
};

// ==========================================
// ASSIGN DRIVER
// ==========================================

const assignDriver = async (req, res) => {
  try {
    const userId = req.userId;
    const truckId = req.params.id;
    const { driverId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required',
      });
    }

    const driver = await Driver.findOne({
      _id: driverId,
      owner: userId,
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const truck =
      await Truck.findOneAndUpdate(
        {
          _id: truckId,
          owner: userId,
        },
        {
          driver: driver._id,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        'driver',
        'name phone licenseNumber licenseExpiry status'
      );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver assigned successfully',
      truck,
    });
  } catch (error) {
    console.error(
      'Assign driver error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to assign driver',
      error: error.message,
    });
  }
};

// ==========================================
// REMOVE DRIVER
// ==========================================

const unassignDriver = async (req, res) => {
  try {
    const userId = req.userId;
    const truckId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const truck =
      await Truck.findOneAndUpdate(
        {
          _id: truckId,
          owner: userId,
        },
        {
          $unset: {
            driver: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        'driver',
        'name phone licenseNumber licenseExpiry status'
      );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver removed successfully',
      truck,
    });
  } catch (error) {
    console.error(
      'Unassign driver error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to remove driver',
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createTruck,
  getTrucks,
  updateTruck,
  deleteTruck,
  assignDriver,
  unassignDriver,
};
