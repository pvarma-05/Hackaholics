import express from 'express';
import ImageKit from 'imagekit';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});
router.post('/upload', protect(), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided. Please select an image to upload.' });
        }
        const response = await imagekit.upload({
            file : req.file.buffer,
            fileName : req.file.originalname,
            folder: "/hackaholics-banners"
        });
        res.json({ url: response.url, fileId: response.fileId });
    } catch (error) {
        console.error('Imagekit upload error:', error);
        res.status(500).json({ error: 'Failed to upload image to Imagekit. Please check server logs.' });
    }
});

export default router;
