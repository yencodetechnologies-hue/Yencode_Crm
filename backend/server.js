const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const db = require('./config/db');
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware');

const adminRoute = require('./routes/adminRoute');
const projectRouter = require('./routes/projectRoute');
const taskRouter = require('./routes/taskRoute');
const verificationRoutes = require('./routes/verificationRoutes');
const clientRoutes = require('./routes/clientRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const superadminRouter = require('./routes/superadminRoutes');
const leadRoutes = require('./routes/leadRoute');
const payrollRoutes = require('./routes/payrollRoute');
const updateLogRoutes = require('./routes/updatelogRoute');
const paymentRoutes = require('./routes/paymentRoute');
const expenseRoutes = require('./routes/expenseRoute');
const momRoutes = require('./routes/momRoute');
const quotationRoutes = require('./routes/quotationRoute');
const placesRoutes = require('./routes/placesRoutes');
const placeDetailsRoute = require('./routes/placeDetailsRoute');
const emailOTP = require('./routes/emailotpRoute');
const callRoutes = require('./routes/callRoute');
const followUpRoutes = require('./routes/followUpRoute');
const campaignRoutes = require('./routes/campaignRoute');
const dashboardRoutes = require('./routes/dashboardRoute');
const reportRoutes = require('./routes/reportRoute');
const activityRoutes = require('./routes/activityRoute');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4132;
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://72.61.236.154:4132')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Public routes (no auth)
app.use('/employee-login', verificationRoutes);
app.use('/admin-login', verificationRoutes);
app.use('/email', emailOTP);

// Protected routes
app.use(authMiddleware);
app.use('/', attendanceRoutes);
app.use('/clients', clientRoutes);
app.use('/leaves', leaveRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/leads', leadRoutes);
app.use('/payroll', payrollRoutes);
app.use('/updatelog', updateLogRoutes);
app.use('/payments', paymentRoutes);
app.use('/expense', expenseRoutes);
app.use('/mom', momRoutes);
app.use('/quotation', quotationRoutes);
app.use('/api', placesRoutes);
app.use('/api/place-details', placeDetailsRoute);
app.use('/calls', callRoutes);
app.use('/followups', followUpRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportRoutes);
app.use('/activities', activityRoutes);

db();
app.use('/', adminRoute);
app.use('/project', projectRouter);
app.use('/task', taskRouter);
app.use('/super-admin', superadminRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
