const express = require("express");

const {
    createComplaint,
    getComplaints,
    getComplaintById,
    getMyComplaints,
    updateComplaint
} = require("../controllers/complaintController");

const { analyzeImageUpload } = require("../controllers/imageAnalysisController");
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Standalone Image Upload & AI Vision Analysis (Protected)
router.post(
    "/analyze-image",
    protect,
    upload.single("image"),
    analyzeImageUpload
);

// Create a new complaint with image upload (Auth runs BEFORE upload and AI)
router.post(
    "/",
    protect,
    authorize("citizen"),
    upload.single("image"),
    createComplaint
);

// Get all complaints
router.get(
    "/",
    protect,
    getComplaints
);

// Get complaints created by current user
router.get(
    "/my",
    protect,
    authorize("citizen"),
    getMyComplaints
);

// Get single complaint by ID
router.get(
    "/:id",
    protect,
    getComplaintById
);

// Authority assigns/updates a complaint (from backend-workflow)
router.put(
    "/:id",
    protect,
    authorize("authority", "university", "industry"),
    updateComplaint
);

module.exports = router;