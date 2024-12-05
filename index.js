const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create an Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json({ limit: '10mb' })); // Allow larger payloads

// MongoDB URL (replace with your actual MongoDB connection string)
const dbURL = 'mongodb+srv://vishnuab1207:cfGPGTfxu8LVkbU6@cluster0.xgensfz.mongodb.net/eshop';

// MongoDB Connection
mongoose
  .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define Location Schema with employeeId and time in milliseconds
const locationSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // Date field includes both date and time
  employeeId: { type: String, required: true }, // Added employeeId
  locations: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      altitude: { type: Number },
      mocked: { type: Boolean },
      time: { type: Date, required: true }, // Time in milliseconds
    },
  ],
});

// Location Model
const Location = mongoose.model('Location', locationSchema);

// API Routes

// Store Location Data
app.post('/api/store-location', async (req, res) => {
  try {
    const { date, employeeId, locations } = req.body;

    // Validate the input
    if (!date || !employeeId || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: false,msg:'error no data' });
    }

    // Convert date to a JavaScript Date object (date and time)
    const parsedDate = new Date(date); // Ensure the date includes both date and time

    // Find existing location data for this employee and date
    let locationData = await Location.findOne({ date: parsedDate, employeeId });

    // If location data exists, check for conflicts
    if (locationData) {
      const existingLocationKeys = new Set(
        locationData.locations.map(loc => `${loc.time}`)
      );

      // Filter out duplicate locations based on latitude, longitude, and time
      const uniqueLocations = locations.filter(
        loc => !existingLocationKeys.has(`${loc.time}`)
      );

      if (uniqueLocations.length > 0) {
        // Add the new unique locations to the existing data
        locationData.locations.push(...uniqueLocations);
        await locationData.save();
      }
    } else {
      // If no location data exists, create a new record
      locationData = new Location({ date: parsedDate, employeeId, locations });
      await locationData.save();
    }

    res.status(201).json({ message: true });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ message: false });
  }
});

// Get All Locations by Date and Employee
// Get Locations by Date Interval and Employee
// Get Locations by Date Interval with Sorted Locations Using Aggregation
app.get('/api/get-all-locations', async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    // Ensure the dates are properly parsed
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    // Build the match query
    const matchQuery = {};

    if (parsedStartDate && parsedEndDate) {
      matchQuery.date = {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      };
    } else if (parsedStartDate) {
      matchQuery.date = { $gte: parsedStartDate };
    } else if (parsedEndDate) {
      matchQuery.date = { $lte: parsedEndDate };
    }

    if (employeeId) {
      matchQuery.employeeId = employeeId;
    }

    // MongoDB aggregation pipeline
    const locations = await Location.aggregate([
      { $match: matchQuery }, // Filter by date range and employeeId
      { $unwind: "$locations" }, // Unwind the locations array
      { $sort: { "locations.time": 1 } }, // Sort by time in ascending order
      {
        $group: {
          _id: "$_id", // Group back by the document's original ID
          date: { $first: "$date" }, // Preserve the date field
          employeeId: { $first: "$employeeId" }, // Preserve the employeeId field
          locations: { $push: "$locations" }, // Reassemble the sorted locations array
        },
      },
    ]);

    res.status(200).json(locations);
  } catch (error) {
    console.error('Error retrieving sorted locations:', error);
    res.status(500).json({ message: 'Failed to retrieve locations' });
  }
});


// Start the Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
