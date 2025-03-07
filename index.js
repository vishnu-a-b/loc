const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Create an Express app
const app = express();

// Middleware
app.use(cors({ origin: "*" })); // Allow all origins
app.use(bodyParser.json({ limit: "10mb" })); // Allow larger payloads

// MongoDB URL (replace with your actual MongoDB connection string)
const dbURL = "mongodb+srv://vishnuab1207:cfGPGTfxu8LVkbU6@cluster0.xgensfz.mongodb.net/eshop";

// MongoDB Connection
mongoose
  .connect(dbURL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Define Location Schema
const locationSchema = new mongoose.Schema(
  {
    staff: { type: String, required: true },
    date: { type: Date, required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
  },
  { collection: "locations" }
);

// Create indexes on employeeId and time for better performance on queries
locationSchema.index({ staff: 1, date: 1 }); // Compound index on employeeId and time

// Location Model
const Location = mongoose.model("Location", locationSchema);

// API Routes

// Store Location Data
app.post("/api/store-location", async (req, res) => {
  try {
    const { locations } = req.body;

    // Validate input
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: false, msg: "Invalid input data" });
    }
    
    // Save locations to the database
    await Location.insertMany(locations);
    res.status(201).json({ message: true, msg: "Locations saved successfully" });
  } catch (error) {
    
    console.error("Error saving location:", error);
    res.status(500).json({ message: false, error: error.message });
  }
});

// Get Locations by Employee
app.get("/api/get-all-locations", async (req, res) => {
  try {
    const { staff, start, end } = req.query;

    // Validate input
    if (!staff) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    // Build the query object
    const query = { staff };
    if (start && end) {
      query.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    // Fetch locations for the given employee within the date range
    const locations = await Location.find(query).sort({ date: 1 });

    res.status(200).json({ message: true, locations });
  } catch (error) {
    console.error("Error retrieving locations:", error);
    res.status(500).json({ message: "Failed to retrieve locations", error: error.message });
  }
});

// Start the Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
