const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const { analyzeImage } = require("../services/imageAnalysisService");
const { generateStructuredAiAnalysis } = require("../services/structuredAiService");

// Valid categories enum
const VALID_CATEGORIES = [
    "education",
    "healthcare",
    "agriculture",
    "water",
    "sanitation",
    "environment",
    "rural-livelihood",
    "accessibility",
    "urban-infrastructure",
    "public-service"
];

// Helper to normalize category string
function normalizeCategory(cat) {
    if (!cat) return null;
    const lower = String(cat).toLowerCase().trim();
    if (VALID_CATEGORIES.includes(lower)) return lower;
    if (lower.includes("water")) return "water";
    if (lower.includes("sanitation") || lower.includes("garbage") || lower.includes("waste")) return "sanitation";
    if (lower.includes("environment") || lower.includes("park")) return "environment";
    if (lower.includes("health")) return "healthcare";
    if (lower.includes("educat")) return "education";
    if (lower.includes("agri")) return "agriculture";
    if (lower.includes("rural")) return "rural-livelihood";
    if (lower.includes("access")) return "accessibility";
    if (lower.includes("service") || lower.includes("electric") || lower.includes("light")) return "public-service";
    if (lower.includes("road") || lower.includes("pothole") || lower.includes("infra")) return "urban-infrastructure";
    return null;
}

// CREATE A NEW COMPLAINT WITH STRUCTURED AI ANALYSIS & DYNAMIC ORG MATCHING
const createComplaint = async (req, res) => {
    try {
        // 1. Authentication check FIRST before any expensive file or AI processing
        if (!req.user || (!req.user.userId && !req.user._id && !req.user.id)) {
            return res.status(401).json({
                message: "Not authorized. Please login."
            });
        }

        const {
            title,
            description,
            category,
            location,
            latitude,
            longitude,
            imageUrl
        } = req.body;

        // 2. Validate required text fields
        if (!title || !description || !category || !location) {
            return res.status(400).json({
                message: "Please provide title, description, category and location"
            });
        }

        // Validate category
        const validCategory = normalizeCategory(category);
        if (!validCategory) {
            return res.status(400).json({
                message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`
            });
        }

        // 3. Strict coordinate range and finite number validation
        let validLatitude = undefined;
        if (latitude !== undefined && latitude !== null && latitude !== "") {
            const numLat = Number(latitude);
            if (!Number.isFinite(numLat) || numLat < -90 || numLat > 90) {
                return res.status(400).json({
                    message: "Invalid latitude. Latitude must be a finite number between -90 and 90."
                });
            }
            validLatitude = numLat;
        }

        let validLongitude = undefined;
        if (longitude !== undefined && longitude !== null && longitude !== "") {
            const numLng = Number(longitude);
            if (!Number.isFinite(numLng) || numLng < -180 || numLng > 180) {
                return res.status(400).json({
                    message: "Invalid longitude. Longitude must be a finite number between -180 and 180."
                });
            }
            validLongitude = numLng;
        }

        // 4. Safe image processing: only trust server-side analyzed images (ignore client-supplied tags)
        let finalImageUrl = typeof imageUrl === "string" ? imageUrl : "";
        let analysisResults = [];

        if (req.file) {
            finalImageUrl = `/uploads/${req.file.filename}`;
            try {
                analysisResults = await analyzeImage(req.file.path);
            } catch (imgErr) {
                console.warn("Server-side image analysis warning (continuing safely):", imgErr.message);
                analysisResults = [];
            }
        }

        // 5. Generate structured AI analysis with verified organization recommendations
        let aiAnalysis = null;
        try {
            aiAnalysis = await generateStructuredAiAnalysis({
                title,
                description,
                location,
                category: validCategory,
                imageAnalysisResults: analysisResults
            });
        } catch (aiErr) {
            console.warn("Structured AI analysis warning (continuing safely):", aiErr.message);
            aiAnalysis = {
                category: validCategory,
                predictedCategory: validCategory,
                categoryMatch: true,
                priority: "medium",
                summary: `Complaint reported for ${validCategory} at ${location}.`,
                affectedGroups: ["Local Residents"],
                requiredExpertise: ["Civic Infrastructure"],
                universityRecommendations: [],
                industryRecommendations: []
            };
        }

        const reportedById = req.user.userId || req.user._id || req.user.id;

        // 6. Create complaint document: citizen's category is authoritative
        const complaint = await Complaint.create({
            title: String(title).trim(),
            description: String(description).trim(),
            category: validCategory, // Authoritative category
            location: String(location).trim(),
            latitude: validLatitude,
            longitude: validLongitude,
            imageUrl: finalImageUrl,
            priority: aiAnalysis && aiAnalysis.priority ? aiAnalysis.priority : "medium",
            imageAnalysisResults: analysisResults,
            aiAnalysis,
            reportedBy: reportedById
        });

        // 7. Response shape: preserving top-level complaint object for frontend compatibility
        res.status(201).json({
            message: "Complaint submitted successfully",
            complaint,
            aiAnalysis
        });

    } catch (error) {
        console.error("Create complaint error:", error.message);

        res.status(500).json({
            message: error.message || "Server error while creating complaint"
        });
    }
};


// GET ALL COMPLAINTS (Preserving top-level count & complaints)
const getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: complaints.length,
            complaints
        });

    } catch (error) {
        console.error("Get complaints error:", error.message);

        res.status(500).json({
            message: "Server error while fetching complaints"
        });
    }
};

// GET SINGLE COMPLAINT BY ID
const getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            complaint
        });
    } catch (error) {
        console.error("Get complaint by id error:", error.message);
        res.status(500).json({
            message: "Server error while fetching complaint details"
        });
    }
};


// GET COMPLAINTS CREATED BY CURRENT USER
const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            reportedBy: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            count: complaints.length,
            complaints
        });

    } catch (error) {
        console.error("Get my complaints error:", error.message);

        res.status(500).json({
            message: "Server error while fetching your complaints"
        });
    }
};


// UPDATE / ASSIGN A COMPLAINT (Preserved from backend-workflow)
const updateComplaint = async (req, res) => {
    try {
        const { assignedTo, assignedEntity, status } = req.body;

        if (
            assignedTo !== undefined &&
            assignedTo !== null &&
            !["University", "Industry"].includes(assignedTo)
        ) {
            return res.status(400).json({
                message: "assignedTo must be either University or Industry"
            });
        }

        const updateData = {};

        if (assignedTo !== undefined) {
            updateData.assignedTo = assignedTo;
        }

        if (assignedEntity !== undefined) {
            updateData.assignedEntity = assignedEntity;
        }

        if (status !== undefined) {
            const allowedStatuses = [
                "reported",
                "validated",
                "consolidated",
                "matched",
                "accepted",
                "in-progress",
                "resolved"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid complaint status"
                });
            }

            updateData.status = status;
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            message: "Complaint updated successfully",
            complaint
        });

    } catch (error) {
        console.error("Update complaint error:", error.message);

        res.status(500).json({
            message: "Server error while updating complaint"
        });
    }
};


module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    getMyComplaints,
    updateComplaint
};