const express = require("express");

const {
    createComplaint,
    getComplaints,
    getMyComplaints,
    updateComplaint
} = require("../controllers/complaintController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Create a new complaint
router.post(
    "/",
    protect,
    authorize("citizen"),
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

// Authority assigns/updates a complaint
router.put(
    "/:id",
    protect,
    authorize("authority", "university"),
    updateComplaint
);

module.exports = router;