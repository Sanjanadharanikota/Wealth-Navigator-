// Load environment variables
require('dotenv').config({ path: './server/.env' });

// Override the port
process.env.PORT = '5001';

// Start the server
require('./server/src/index');

const scanRoutes = require('./src/routes/scan');
// ...
app.use('/api/scan', scanRoutes);