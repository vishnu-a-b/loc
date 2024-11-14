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
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Number, required: true },
});

const Location = mongoose.model('Location', locationSchema);

// Route to store location data
app.post('/api/store-location', async (req, res) => {
  try {
    const { latitude, longitude, timestamp } = req.body;

    // Create a new location document
    const newLocation = new Location({
      latitude,
      longitude,
      timestamp,
    });

    // Save the location data to MongoDB
    await newLocation.save();

    res.status(201).json({ message: 'Location saved successfully' });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ message: 'Failed to save location' });
  }
});

// Route to get all locations
app.get('/api/get-all-locations', async (req, res) => {
  try {
    // Retrieve all location data from the database
    const locations = await Location.find();

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
