const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import CORS

// Create an Express app
const app = express();

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json());

// MongoDB URL (replace with your actual MongoDB connection string)
const dbURL = 'mongodb+srv://vishnuab1207:cfGPGTfxu8LVkbU6@cluster0.xgensfz.mongodb.net/eshop';

// MongoDB Connection
mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// Create a schema for Location Data
const locationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  locations: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      time: { type: Number, required: true },
    }
  ],
});

const Location = mongoose.model('Location', locationSchema);

// Route to store location data
app.post('/api/store-location', async (req, res) => {
  try {
    const { date, locations } = req.body;

    // Check if the date already exists
    let locationData = await Location.findOne({ date });

    // If the date exists, update it
    if (locationData) {
      locationData.locations.push(...locations);
      await locationData.save();
    } else {
      // If the date doesn't exist, create a new entry
      locationData = new Location({
        date,
        locations,
      });
      await locationData.save();
    }

    res.status(201).json({ message: true });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ message: false });
  }
});

// Route to get all locations for a specific date
app.get('/api/get-all-locations', async (req, res) => {
  try {
    const { date } = req.query;

    // If no date is provided, fetch all location data
    let locations;
    if (date) {
      // Find locations by the specified date
      locations = await Location.find({ date: new Date(date) });
    } else {
      // Get all locations if no date is provided
      locations = await Location.find();
    }

    // Respond with the data
    res.status(200).json(locations);
  } catch (error) {
    console.error('Error retrieving locations:', error);
    res.status(500).json({ message: 'Failed to retrieve locations' });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
