const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  documentType: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    default: 0
  },
  verificationStatus: {
    type: String,
    enum: ['Verified', 'Needs Review', 'Not Verified'],
    default: 'Not Verified'
  },
  verificationMethod: {
    type: String,
    default: 'AI/ML Document Analysis'
  },
  verificationDate: {
    type: Date,
    default: Date.now
  },
  issuingAuthority: {
    type: String,
    default: 'Unknown'
  },
  issueDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String
  }
});

module.exports = mongoose.model('document', DocumentSchema);
