const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create an Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins

app.use(bodyParser.json({ limit: '10mb' })); // Allow larger payloads

// MongoDB URL (replace with your actual MongoDB connection string)
const dbURL = 'mongodb+srv://vishnuab1207:cfGPGTfxu8LVkbU6@cluster0.xgensfz.mongodb.net/eshop';

// MongoDB Connection
mongoose
  .connect(dbURL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define Location Schema
const locationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  employeeId: { type: String, required: true },
  locations: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      altitude: { type: Number },
      mocked: { type: Boolean },
      time: { type: Date, required: true },
    },
  ],
  
},
{ collection: 'locations' }
);

// Location Model
const Location = mongoose.model('Location', locationSchema);

// API Routes

// Store Location Data
app.post('/api/store-location', async (req, res) => {
  try {
    const { date, employeeId, locations } = req.body;

    // Validate input
    if (!date || !employeeId || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: false, msg: 'Invalid input data' });
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: false, msg: 'Invalid date format' });
    }

    // Find existing location data for this employee and date
    let locationData = await Location.findOne({ date: parsedDate, employeeId });

    if (locationData) {
      const existingLocationKeys = new Set(locationData.locations.map(loc => loc.time.toISOString()));

      const uniqueLocations = locations.filter(
        loc => !existingLocationKeys.has(new Date(loc.time).toISOString())
      );

      if (uniqueLocations.length > 0) {
        locationData.locations.push(...uniqueLocations);
        await locationData.save();
      }
    } else {
      locationData = new Location({ date: parsedDate, employeeId, locations });
      await locationData.save();
    }

    res.status(201).json({ message: true });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ message: false, error: error.message });
  }
});

// Get Locations by Date Range and Employee
app.get('/api/get-all-locations', async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    console.log(parsedStartDate, parsedEndDate, employeeId)
    if ((startDate && isNaN(parsedStartDate)) || (endDate && isNaN(parsedEndDate))) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const matchQuery = {};
    if (parsedStartDate && parsedEndDate) {
      matchQuery.date = { $gte: parsedStartDate, $lte: parsedEndDate };
    } else if (parsedStartDate) {
      matchQuery.date = { $gte: parsedStartDate };
    } else if (parsedEndDate) {
      matchQuery.date = { $lte: parsedEndDate };
    }

    if (employeeId) {
      matchQuery.employeeId = employeeId;
    }

    const locations = await Location.aggregate([
      { $match: matchQuery },
      { $unwind: '$locations' },
      { $sort: { 'locations.time': 1 } },
      {
        $group: {
          _id: '$_id',
          date: { $first: '$date' },
          employeeId: { $first: '$employeeId' },
          locations: { $push: '$locations' },
        },
      },
    ]);

    res.status(200).json(locations);
  } catch (error) {
    console.error('Error retrieving locations:', error);
    res.status(500).json({ message: 'Failed to retrieve locations', error: error.message });
  }
});

// Start the Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
