require('dotenv').config();

const express = require('express');
const cors = require('cors');
const tripRoutes = require('./routes/tripRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const authRoutes = require('./routes/authroutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const app = express();

// // Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); // 2. Use Auth Routes

// Routes
app.use('/api', tripRoutes);
app.use('/api', expenseRoutes);
app.use('/api', balanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', notificationRoutes);
app.use('/api', currencyRoutes);
// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// Start Server
const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
