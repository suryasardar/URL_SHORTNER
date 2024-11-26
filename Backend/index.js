 

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

 
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

 
const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortId: String,
    clickCount: { type: Number, default: 0 },
    lastAccessed: Date
});

const Url = mongoose.model('Url', urlSchema);

// To shorten URLs
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
 

    // Validate the URL format
    if (!originalUrl || typeof originalUrl !== 'string') {
        return res.status(400).send("Invalid URL");
    }

    const shortId = shortid.generate();

    
    const url = new Url({ originalUrl, shortId });

    try {
        await url.save();
        res.json({ shortenedUrl: `${req.protocol}://${req.get('host')}/${shortId}` });
    } catch (error) {
        console.error("Error saving URL:", error);
        return res.status(500).send("Internal Server Error");
    }
});
// Redirect to original URL
app.get('/data/:shortId', async (req, res) => {
    const { shortId } = req.params;

    try {
         
        const url = await Url.findOne({ shortId });

        if (url) {
            // Update click count and last accessed time
            url.clickCount++;
            url.lastAccessed = new Date();
            await url.save();

            
            res.json({ originalUrl: url.originalUrl, clickCount: url.clickCount });
        } else {
             
            return res.status(404).send("URL not found");
        }
    } catch (error) {
        
        console.error("Error fetching URL:", error);
        return res.status(500).send("Internal Server Error");
    }
});

// Get statistics for a shortened URL
app.get('/stats/:shortId', async (req, res) => {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId });
    
    if (!url) return res.status(404).send("URL not found");
    
    res.json({
        totalClicks: url.clickCount,
        lastAccessed: url.lastAccessed
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});