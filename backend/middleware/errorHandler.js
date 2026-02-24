const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developer to see in terminal
  console.error('💥 Error:', err);

  // ─── Mongoose Bad ObjectId ───────────────────
  // When someone passes invalid MongoDB ID
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    return res.status(404).json({ 
      success: false, 
      message: error.message 
    });
  }

  // ─── Mongoose Duplicate Key ──────────────────
  // When email already exists in database
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }

  // ─── Mongoose Validation Error ───────────────
  // When required fields are missing
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }

  // ─── Default Error ───────────────────────────
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;