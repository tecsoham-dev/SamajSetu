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


// Resolve an authenticated account's linked organization for scoped access.
async function getLinkedOrganization(req) {
    const User = require("../models/User");
    const userId = req.user && (req.user.userId || req.user._id || req.user.id);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findById(userId).select("role organizationId organizationType").lean();
}

function isAssignedToUserOrganization(complaint, user) {
    return Boolean(
        user && user.organizationId && user.organizationType &&
        complaint.assignedEntity &&
        String(complaint.assignedEntity) === String(user.organizationId) &&
        complaint.assignedTo === user.organizationType
    );
}

// Authority sees all; citizens see their own; institutions see only exact assignments.
const getComplaints = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "citizen") {
            filter.reportedBy = req.user.userId;
        } else if (["university", "industry"].includes(req.user.role)) {
            const user = await getLinkedOrganization(req);
            const expectedType = req.user.role === "university" ? "University" : "Industry";
            if (!user || !user.organizationId || user.organizationType !== expectedType) {
                return res.status(403).json({ message: "Your account is not linked to an organization." });
            }
            filter.assignedTo = expectedType;
            filter.assignedEntity = user.organizationId;
        } else if (req.user.role !== "authority") {
            return res.status(403).json({ message: "Access denied." });
        }

        const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ count: complaints.length, complaints });
    } catch (error) {
        console.error("Get complaints error:", error.message);
        return res.status(500).json({ message: "Server error while fetching complaints" });
    }
};

// Single-record access follows the same policy as the list endpoint.
const getComplaintById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid complaint ID" });
        }
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        if (req.user.role === "citizen") {
            if (String(complaint.reportedBy) !== String(req.user.userId)) {
                return res.status(403).json({ message: "You can view only your own complaints." });
            }
        } else if (["university", "industry"].includes(req.user.role)) {
            const user = await getLinkedOrganization(req);
            const expectedType = req.user.role === "university" ? "University" : "Industry";
            if (!user || user.organizationType !== expectedType || !isAssignedToUserOrganization(complaint, user)) {
                return res.status(403).json({ message: "This complaint is not assigned to your organization." });
            }
        } else if (req.user.role !== "authority") {
            return res.status(403).json({ message: "Access denied." });
        }
        return res.status(200).json({ complaint });
    } catch (error) {
        console.error("Get complaint by id error:", error.message);
        return res.status(500).json({ message: "Server error while fetching complaint details" });
    }
};

const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ reportedBy: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ count: complaints.length, complaints });
    } catch (error) {
        console.error("Get my complaints error:", error.message);
        return res.status(500).json({ message: "Server error while fetching your complaints" });
    }
};

// Authority alone chooses the final organization. Assigned institutions may update workflow status only.
const updateComplaint = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid complaint ID" });
        }
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        const body = req.body || {};
        const hasAssignmentFields = Object.prototype.hasOwnProperty.call(body, "assignedTo") ||
            Object.prototype.hasOwnProperty.call(body, "assignedEntity");
        const updateData = {};

        if (req.user.role === "authority") {
            if (hasAssignmentFields) {
                const assignedTo = body.assignedTo;
                const assignedEntity = body.assignedEntity;
                if (!assignedTo || !["University", "Industry"].includes(assignedTo) ||
                    !assignedEntity || !mongoose.Types.ObjectId.isValid(assignedEntity)) {
                    return res.status(400).json({ message: "Provide a valid assignedTo and assignedEntity." });
                }
                const Organization = assignedTo === "University"
                    ? require("../models/University")
                    : require("../models/Industry");
                const organization = await Organization.findById(assignedEntity).select("verificationStatus");
                if (!organization) return res.status(404).json({ message: "Selected organization not found." });
                if (organization.verificationStatus !== "Verified") {
                    return res.status(400).json({ message: "Only verified organizations can receive assignments." });
                }
                updateData.assignedTo = assignedTo;
                updateData.assignedEntity = organization._id;
                if (complaint.status === "reported" || complaint.status === "validated") updateData.status = "matched";
            }
            if (body.status !== undefined) {
                const allowedStatuses = ["reported", "validated", "consolidated", "matched", "accepted", "in-progress", "resolved"];
                if (!allowedStatuses.includes(body.status)) return res.status(400).json({ message: "Invalid complaint status" });
                updateData.status = body.status;
            }
            const allowedAuthorityFields = ["priority"];
            for (const field of allowedAuthorityFields) {
                if (body[field] !== undefined) updateData[field] = body[field];
            }
        } else if (["university", "industry"].includes(req.user.role)) {
            if (hasAssignmentFields) return res.status(403).json({ message: "Only authority can assign or reassign complaints." });
            const user = await getLinkedOrganization(req);
            const expectedType = req.user.role === "university" ? "University" : "Industry";
            if (!user || user.organizationType !== expectedType || !isAssignedToUserOrganization(complaint, user)) {
                return res.status(403).json({ message: "You can update only complaints assigned to your organization." });
            }
            const allowedStatuses = ["accepted", "in-progress", "resolved"];
            if (body.status !== undefined) {
                if (!allowedStatuses.includes(body.status)) return res.status(400).json({ message: "Organization users may set status to accepted, in-progress, or resolved." });
                const validNextStatuses = {
                    reported: ["accepted"],
                    validated: ["accepted"],
                    consolidated: ["accepted"],
                    matched: ["accepted"],
                    accepted: ["accepted", "in-progress"],
                    "in-progress": ["in-progress", "resolved"],
                    resolved: ["resolved"]
                };
                if (!validNextStatuses[complaint.status] || !validNextStatuses[complaint.status].includes(body.status)) {
                    return res.status(409).json({ message: `Invalid status transition from ${complaint.status} to ${body.status}.` });
                }
                updateData.status = body.status;
            }
            if (Object.keys(updateData).length === 0) return res.status(400).json({ message: "No permitted update fields supplied." });
        } else {
            return res.status(403).json({ message: "Access denied." });
        }

        if (Object.keys(updateData).length === 0) return res.status(400).json({ message: "No valid update fields supplied." });
        Object.assign(complaint, updateData);
        await complaint.save();
        return res.status(200).json({ message: "Complaint updated successfully", complaint });
    } catch (error) {
        console.error("Update complaint error:", error.message);
        return res.status(500).json({ message: "Server error while updating complaint" });
    }
};

module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    getMyComplaints,
    updateComplaint
};