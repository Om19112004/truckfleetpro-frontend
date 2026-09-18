const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema(
  {
    chequeReceived: {
      type: Boolean,
      default: false,
    },

    chequeDeposited: {
      type: Boolean,
      default: false,
    },

    moneyReceived: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    tripNumber: {
      type: Number,
      min: 1,
      index: true,
    },

    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: false,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: false,
    },

    from: {
      type: String,
      required: true,
      trim: true,
    },

    to: {
      type: String,
      required: true,
      trim: true,
    },

    startLocation: {
      type: String,
      trim: true,
      default: '',
    },

    endLocation: {
      type: String,
      trim: true,
      default: '',
    },

    date: {
      type: Date,
      required: true,
    },

    tripDate: {
      type: Date,
    },

    distance: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        'scheduled',
        'running',
        'completed',
        'cancelled',
      ],
      default: 'scheduled',
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // Trip payment details
    partyName: {
      type: String,
      trim: true,
      default: '',
    },

    freightAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Trip checklist
    checklist: {
      type: checklistSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trip', tripSchema);