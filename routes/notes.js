const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Notes = require('../models/Notes');

const router = express.Router();

// Ensure uploads directory exists
const ensureUploadsDir = () => {
    const uploadPath = path.join(__dirname, '../uploads/notes');
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Created uploads directory:', uploadPath);
    }
    return uploadPath;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = ensureUploadsDir();
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp and random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = uniqueSuffix + fileExtension;
        cb(null, fileName);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|ppt|pptx|jpg|png|jpeg/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype.toLowerCase());

    if (extName && mimeType) {
        return cb(null, true);
    } else {
        cb(new Error('Only documents and images are allowed (PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG, JPEG)'));
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        fieldSize: 1024 * 1024 // 1MB for text fields
    },
    fileFilter
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'File size too large. Maximum size is 10MB.' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ msg: 'Unexpected field in upload.' });
        }
        return res.status(400).json({ msg: 'File upload error: ' + error.message });
    }
    if (error.message.includes('Only documents and images are allowed')) {
        return res.status(400).json({ msg: error.message });
    }
    next(error);
};

// Upload notes endpoint
router.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return handleMulterError(err, req, res, next);
        }

        // Process the upload
        uploadNotesHandler(req, res, next);
    });
});

const uploadNotesHandler = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const file = req.file;

        console.log('Upload request received:', { title, description, file: file ? file.filename : 'no file' });

        // Validate required fields
        if (!file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        if (!title || title.trim().length === 0) {
            // Clean up uploaded file if validation fails
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ msg: 'Title is required' });
        }

        // Create new note document
        const newNote = new Notes({
            title: title.trim(),
            description: description ? description.trim() : '',
            fileName: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileType: path.extname(file.originalname).toLowerCase(),
            fileSize: file.size,
            uploadDate: new Date()
        });

        // Save to database
        await newNote.save();

        console.log('Note saved successfully:', newNote._id);

        res.status(201).json({
            msg: 'Notes uploaded successfully',
            note: {
                _id: newNote._id,
                title: newNote.title,
                description: newNote.description,
                originalName: newNote.originalName,
                fileType: newNote.fileType,
                fileSize: newNote.fileSize,
                uploadDate: newNote.uploadDate
            }
        });

    } catch (error) {
        console.error('Upload error:', error);

        // Clean up uploaded file if database save fails
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }

        res.status(500).json({ msg: 'Server error during upload: ' + error.message });
    }
};

// Get all notes
router.get('/', async (req, res) => {
    try {
        const notes = await Notes.find()
            .select('title description originalName fileType fileSize uploadDate')
            .sort({ uploadDate: -1 });

        console.log(`Retrieved ${notes.length} notes`);
        res.json(notes);
    } catch (error) {
        console.error('Fetch notes error:', error);
        res.status(500).json({ msg: 'Server error while fetching notes: ' + error.message });
    }
});

// Download file endpoint
router.get('/download/:id', async (req, res) => {
    try {
        const note = await Notes.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        const filePath = path.resolve(note.filePath);

        if (!fs.existsSync(filePath)) {
            console.error('File not found on disk:', filePath);
            return res.status(404).json({ msg: 'File not found on server' });
        }

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${note.originalName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            res.status(500).json({ msg: 'Error streaming file' });
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ msg: 'Server error during download: ' + error.message });
    }
});

// Delete note endpoint (optional - for admin use)
router.delete('/:id', async (req, res) => {
    try {
        const note = await Notes.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        // Delete file from disk
        if (fs.existsSync(note.filePath)) {
            fs.unlinkSync(note.filePath);
        }

        // Delete from database
        await Notes.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ msg: 'Server error during deletion: ' + error.message });
    }
});

module.exports = router;