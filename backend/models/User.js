const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email',
      ],
    },

    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, 
      // select:false means password will NEVER be
      // returned in queries by default (security!)
    },

    dateOfBirth: {
      type: Date,
    },

    healthProfile: {
      diagnosedWithPCOD: { 
        type: Boolean, 
        default: false 
      },
      averageCycleLength: { 
        type: Number, 
        default: 28 
      },
      averagePeriodLength: { 
        type: Number, 
        default: 5 
      },
      weight: { type: Number },
      height: { type: Number },
      medications: [{ type: String }],
    },

  },
  { 
    timestamps: true 
    // automatically adds createdAt and updatedAt fields
  }
);

// ─────────────────────────────────────────────────
// BEFORE saving user, hash the password
// This runs automatically every time a user is saved
// ─────────────────────────────────────────────────
userSchema.pre('save', async function () {
  // Only hash if password was changed/new
  if (!this.isModified('password')) return;
  
  // Hash password with strength of 12
  this.password = await bcrypt.hash(this.password, 12);
});

// ─────────────────────────────────────────────────
// Method to compare passwords during login
// ─────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);