require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(cors());
app.use(express.json());

// Serve the HTML frontend files to the public
app.use(express.static(__dirname));

// 1. Connect to Cloudinary (Image Hosting)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'kinetic-plus' },
});
const upload = multer({ storage: storage });

// 2. Connect to MongoDB (Database)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Cloud'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the Database Structure
const equipmentSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    imageUrl: String
});
const Equipment = mongoose.model('Equipment', equipmentSchema);

// 3. API Routes with Error Tracking
app.post('/api/add-equipment', upload.single('image'), async (req, res) => {
    console.log("\n--- NEW UPLOAD STARTED ---");
    console.log("Step 1: Form data reached the server.");
    
    try {
        if (!req.file) {
            console.log("Error: Cloudinary refused the image. Check your Cloudinary passwords in .env");
            return res.status(400).json({ message: 'Image upload failed. Check passwords.' });
        }
        
        console.log("Step 2: Image successfully saved to Cloudinary.");
        console.log("Cloudinary Link:", req.file.path);

        const newEquipment = new Equipment({
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            imageUrl: req.file.path 
        });

        console.log("Step 3: Attempting to save text to MongoDB...");
        await newEquipment.save();
        
        console.log("Step 4: Everything saved perfectly!");
        res.json({ message: 'Equipment successfully saved to the cloud!' });
        
    } catch (error) {
        console.error("Crash during upload:", error.message);
        res.status(500).json({ message: 'Server crashed during upload.' });
    }
});

app.get('/api/get-equipment', async (req, res) => {
    const items = await Equipment.find();
    res.json(items);
});

app.post('/api/delete-equipment', async (req, res) => {
    try {
        await Equipment.findOneAndDelete({ imageUrl: req.body.imageUrl });
        res.json({ message: 'Equipment successfully deleted from database.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Cloud-ready server running on port ${PORT}`);
});