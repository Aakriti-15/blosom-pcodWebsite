const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// ─────────────────────────────────────────────────
// Helper: Generate JWT Token
// ─────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign(
    { id }, // payload — what's inside the token
    process.env.JWT_SECRET, // secret key to sign it
    { expiresIn: process.env.JWT_EXPIRE || '7d' } // expiry
  );
};

// ─────────────────────────────────────────────────
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, password, dateOfBirth } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please login.' 
      });
    }

    // Create new user
    // Password gets hashed automatically (from User model)
    const user = await User.create({ 
      name, 
      email, 
      password, 
      dateOfBirth 
    });

    // Generate token for this user
    const token = generateToken(user._id);

    // Send response
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        healthProfile: user.healthProfile,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    next(error); // Pass to error handler
  }
};

// ─────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    // +password because we set select:false on password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Compare entered password with hashed password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        healthProfile: user.healthProfile,
      },
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private (needs token)
// ─────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        healthProfile: user.healthProfile,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, dateOfBirth, healthProfile } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, dateOfBirth, healthProfile },
      { new: true, runValidators: true }
      // new:true returns updated user, not old one
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        healthProfile: user.healthProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ─────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Set new password (will be hashed by pre save hook)
    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password changed successfully!' 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword 
};