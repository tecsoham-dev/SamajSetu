const express = require("express");

const {
    getChallenges,
    getChallengeById,
    createChallenge,
    updateChallenge
} = require("../controllers/challengeController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all challenges
router.get(
    "/",
    protect,
    getChallenges
);

// Get one challenge
router.get(
    "/:id",
    protect,
    getChallengeById
);

// Create a challenge
router.post(
    "/",
    protect,
    authorize("authority"),
    createChallenge
);

// Update a challenge
router.put(
    "/:id",
    protect,
    authorize("authority"),
    updateChallenge
);

module.exports = router;