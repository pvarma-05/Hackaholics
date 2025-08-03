import express from 'express';
import multer from 'multer';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageBuffer = file.buffer;
    const clerkResponse = await clerkClient.users.setProfileImage({
      userId: req.body.clerkId,
      file: imageBuffer,
    });

    res.json({ url: clerkResponse.profileImageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
