const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');


const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
// app.use('/api/pigeons', require('./routes/pigeonRoutes'));
// app.use('/api/replies', require('./routes/replyRoutes'));
// app.use('/api/friends', require('./routes/friendRoutes'));

app.get('/', (req, res) => res.send('Kobutor backend is running'));

module.exports = app;
