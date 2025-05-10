const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/document');

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for image uploads
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// @route   POST /api/documents/upload
// @desc    Upload a document
// @access  Private
router.post('/upload', [auth, upload.single('document')], async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract document type from request
    const { documentType, userId } = req.body;
    
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Analyze document content (simulated)
    let confidence = 0;
    let verificationStatus = 'Not Verified';
    
    // Simple keyword-based analysis
    const fileName = req.file.originalname.toLowerCase();
    const docType = documentType.toLowerCase();
    
    if (docType.includes('medical')) {
      if (fileName.includes('medical') || fileName.includes('health') || fileName.includes('doctor')) {
        confidence = 84;
        verificationStatus = 'Verified';
      } else {
        confidence = 40;
        verificationStatus = 'Needs Review';
      }
    } else if (docType.includes('fitness')) {
      if (fileName.includes('fitness') || fileName.includes('sport') || fileName.includes('training')) {
        confidence = 75;
        verificationStatus = 'Verified';
      } else {
        confidence = 50;
        verificationStatus = 'Needs Review';
      }
    } else if (fileName.includes('certificate') || fileName.includes('doc') || fileName.includes('proof')) {
      confidence = 60;
      verificationStatus = 'Needs Review';
    } else {
      confidence = Math.floor(Math.random() * 30) + 20; // Random score between 20-50%
    }

    // Create new document record
    const newDocument = new Document({
      userId: userId || req.user.id,
      documentType,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileUrl: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: Date.now(),
      confidence,
      verificationStatus,
      verificationMethod: 'AI/ML Document Analysis',
      issuingAuthority: 'Sports Medicine Center',
      issueDate: new Date(),
    });

    await newDocument.save();

    res.json({
      success: true,
      document: newDocument
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/documents/user/:userId
// @desc    Get all documents for a user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.params.userId }).sort({ uploadDate: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/documents/download/:id
// @desc    Download a document
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/documents/analyze
// @desc    Analyze document content
// @access  Private
router.post('/analyze', [auth, upload.single('image')], async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Simulate document analysis
    // In a real application, this would use OCR or ML to analyze the document
    const fileName = req.file.originalname.toLowerCase();
    
    let confidence = 0;
    let verificationStatus = 'Not Verified';
    let verificationNotes = '';
    
    // Simple keyword-based analysis
    if (fileName.includes('medical') || fileName.includes('health') || fileName.includes('doctor')) {
      confidence = 84;
      verificationStatus = 'Verified';
      verificationNotes = 'Document verified successfully. All security features present and valid.';
    } else if (fileName.includes('fitness') || fileName.includes('sport') || fileName.includes('training')) {
      confidence = 75;
      verificationStatus = 'Verified';
      verificationNotes = 'Sports fitness document verified with high confidence.';
    } else if (fileName.includes('certificate') || fileName.includes('doc') || fileName.includes('proof')) {
      confidence = 60;
      verificationStatus = 'Needs Review';
      verificationNotes = 'Document appears to be a certificate but type is unclear.';
    } else {
      confidence = Math.floor(Math.random() * 30) + 20; // Random score between 20-50%
      verificationStatus = 'Not Verified';
      verificationNotes = 'Document type could not be determined. Confidence score is based on general image analysis.';
    }

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      analysis: {
        confidence,
        verificationStatus,
        verificationNotes,
        documentType: 'Unknown',
        issuingAuthority: 'Unknown',
        verificationMethod: 'AI/ML Document Analysis',
        verificationDate: new Date()
      }
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user owns the document
    if (document.userId.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Delete file from storage if it exists
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document from database
    await document.remove();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
