const mongoose = require('mongoose');

const dieselSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    litres: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    odometer: {
      type: Number,
      default: 0,
      min: 0,
    },

    fuelStation: {
      type: String,
      trim: true,
      default: '',
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Diesel', dieselSchema);