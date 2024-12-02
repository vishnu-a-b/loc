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

// Define Location Schema
const locationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  locations: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      altitude: { type: Number },
      mocked: { type: Boolean },
      time: { type: Number, required: true },
    },
  ],
});

// Location Model
const Location = mongoose.model('Location', locationSchema);

// API Routes

// Store Location Data
app.post('/api/store-location', async (req, res) => {
  try {
    const { date, locations } = req.body;

    if (!date || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    let locationData = await Location.findOne({ date: new Date(date) });

    if (locationData) {
      const existingLocationKeys = new Set(
        locationData.locations.map(loc => `${loc.latitude},${loc.longitude},${loc.time}`)
      );

      const uniqueLocations = locations.filter(
        loc => !existingLocationKeys.has(`${loc.latitude},${loc.longitude},${loc.time}`)
      );

      if (uniqueLocations.length > 0) {
        locationData.locations.push(...uniqueLocations);
        await locationData.save();
      }
    } else {
      locationData = new Location({ date, locations });
      await locationData.save();
    }

    res.status(201).json({ message: true });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ message: false });
  }
});

// Get All Locations by Date
app.get('/api/get-all-locations', async (req, res) => {
  try {
    const { date } = req.query;
    let locations;

    if (date) {
      locations = await Location.find({ date: new Date(date) });
    } else {
      locations = await Location.find();
    }

    res.status(200).json(locations);
  } catch (error) {
    console.error('Error retrieving locations:', error);
    res.status(500).json({ message: 'Failed to retrieve locations' });
  }
});

// Start the Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
