const mongoose = require('mongoose');

const NotesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Notes', NotesSchema);
