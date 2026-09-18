const Driver = require('../models/Driver');

// ==========================================
// CREATE DRIVER
// ==========================================

const createDriver = async (req, res) => {
  try {
    const {
      name,
      phone,
      licenseNumber,
      licenseExpiry,
      address,
    } = req.body;

    // Only name and phone are required
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required',
      });
    }

    const normalizedName = String(name).trim();
    const normalizedPhone = String(phone).trim();

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required',
      });
    }

    // License number is optional now
    let normalizedLicenseNumber = '';

    if (licenseNumber !== undefined && licenseNumber !== null) {
      normalizedLicenseNumber = String(
        licenseNumber
      ).trim();
    }

    // Only check duplicate license when provided
    if (normalizedLicenseNumber) {
      const existingDriver = await Driver.findOne({
        owner: req.userId,
        licenseNumber: normalizedLicenseNumber,
      });

      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message:
            'Driver with this license number already exists',
        });
      }
    }

    const driver = await Driver.create({
      owner: req.userId,
      name: normalizedName,
      phone: normalizedPhone,
      licenseNumber: normalizedLicenseNumber,
      licenseExpiry:
        licenseExpiry || null,
      address: address?.trim() || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      driver,
    });
  } catch (error) {
    console.error('Create driver error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while creating driver',
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL DRIVERS
// ==========================================

const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({
      owner: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error('Get drivers error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching drivers',
    });
  }
};

// ==========================================
// UPDATE DRIVER
// ==========================================

const updateDriver = async (req, res) => {
  try {
    const userId = req.userId;
    const driverId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const {
      name,
      phone,
      licenseNumber,
      licenseExpiry,
      address,
      status,
    } = req.body;

    // Only name and phone are required
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required',
      });
    }

    const normalizedName = String(name).trim();
    const normalizedPhone = String(phone).trim();

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required',
      });
    }

    let normalizedLicenseNumber = '';

    if (licenseNumber !== undefined && licenseNumber !== null) {
      normalizedLicenseNumber = String(
        licenseNumber
      ).trim();
    }

    // Check duplicate license only if provided
    if (normalizedLicenseNumber) {
      const existingDriver = await Driver.findOne({
        owner: userId,
        licenseNumber: normalizedLicenseNumber,
        _id: { $ne: driverId },
      });

      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message:
            'Another driver with this license number already exists',
        });
      }
    }

    const updateData = {
      name: normalizedName,
      phone: normalizedPhone,
      licenseNumber: normalizedLicenseNumber,
      licenseExpiry:
        licenseExpiry || null,
      address: address?.trim() || '',
    };

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver status',
        });
      }

      updateData.status = status;
    }

    const driver = await Driver.findOneAndUpdate(
      {
        _id: driverId,
        owner: userId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      driver,
    });
  } catch (error) {
    console.error('Update driver error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while updating driver',
      error: error.message,
    });
  }
};

// ==========================================
// DELETE DRIVER
// ==========================================

const deleteDriver = async (req, res) => {
  try {
    const userId = req.userId;
    const driverId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const driver = await Driver.findOneAndDelete({
      _id: driverId,
      owner: userId,
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    console.error('Delete driver error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting driver',
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
};