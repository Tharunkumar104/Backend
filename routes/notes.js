const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Notes = require('../models/Notes');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/notes';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|txt|ppt|pptx|jpg|png|jpeg/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            cb(new Error('Only documents and images are allowed'));
        }
    }
});

// Upload notes
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const newNote = new Notes({
            title,
            description,
            fileName: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileType: path.extname(file.originalname),
            fileSize: file.size
        });

        await newNote.save();
        res.json({ msg: 'Notes uploaded successfully', note: newNote });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ msg: 'Server error during upload' });
    }
});

// Get all notes
router.get('/', async (req, res) => {
    try {
        const notes = await Notes.find().sort({ uploadDate: -1 });
        res.json(notes);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ msg: 'Server error while fetching notes' });
    }
});

// Download file
router.get('/download/:id', async (req, res) => {
    try {
        const note = await Notes.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        const filePath = path.resolve(note.filePath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'File not found on server' });
        }

        res.download(filePath, note.originalName);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ msg: 'Server error during download' });
    }
});

module.exports = router;
