const express = require("express");
const router = express.Router();

const {
    analyzeComplaint,
    detectDuplicates,
    matchUniversitiesAndIndustries,
    routeAuthority,
    processPipeline
} = require("./aiEngine");

const { protect } = require("../middleware/authMiddleware");

const Complaint = require("../models/Complaint");
const University = require("../models/University");
const Industry = require("../models/Industry");
const Authority = require("../models/Authority");
const Challenge = require("../models/Challenge");

/*
|--------------------------------------------------------------------------
| CATEGORY NORMALIZATION
|--------------------------------------------------------------------------
*/

const categoryToAI = {
    education: "Infrastructure",
    healthcare: "Infrastructure",
    agriculture: "Environment",
    water: "Water Supply",
    sanitation: "Sanitation",
    environment: "Environment",
    "rural-livelihood": "Environment",
    accessibility: "Infrastructure",
    "urban-infrastructure": "Infrastructure",
    "public-service": "Infrastructure"
};

const categoryToDatabase = {
    Infrastructure: "urban-infrastructure",
    "Water Supply": "water",
    Sanitation: "sanitation",
    Security: "public-service",
    "Public Transport": "public-service",
    Electricity: "public-service",
    Environment: "environment"
};

const priorityToDatabase = {
    Low: "low",
    Medium: "medium",
    High: "high",
    Urgent: "critical"
};

/*
|--------------------------------------------------------------------------
| AI STATUS
|--------------------------------------------------------------------------
*/

router.get("/status", protect, (req, res) => {
    res.json({
        success: true,
        message: "SamajSetu AI module is connected.",
        engine: "Local deterministic NLP + Jaccard similarity"
    });
});

/*
|--------------------------------------------------------------------------
| ANALYZE COMPLAINT
|--------------------------------------------------------------------------
*/

router.post("/analyze-complaint", protect, async (req, res) => {
    try {
        const complaint = req.body;

        if (!complaint || !complaint.title || !complaint.description) {
            return res.status(400).json({
                success: false,
                error: "Complaint title and description are required."
            });
        }

        const aiInput = {
            ...complaint,
            category:
                categoryToAI[complaint.category] ||
                complaint.category ||
                "Infrastructure"
        };

        const analysis = analyzeComplaint(aiInput);

        const databaseCategory =
            categoryToDatabase[analysis.category] ||
            complaint.category ||
            "urban-infrastructure";

        const databasePriority =
            priorityToDatabase[analysis.priority] || "medium";

        return res.json({
            success: true,
            data: {
                ...analysis,
                category: databaseCategory,
                priority: databasePriority
            }
        });
    } catch (error) {
        console.error("AI analysis error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "AI analysis failed."
        });
    }
});

/*
|--------------------------------------------------------------------------
| DETECT DUPLICATES
|--------------------------------------------------------------------------
*/

router.post("/detect-duplicates", protect, async (req, res) => {
    try {
        const { newComplaint, threshold } = req.body;

        if (!newComplaint) {
            return res.status(400).json({
                success: false,
                error: "newComplaint is required."
            });
        }

        const existingComplaints = await Complaint.find({
            _id: {
                $ne: newComplaint._id || null
            }
        }).lean();

        const result = detectDuplicates(
            newComplaint,
            existingComplaints,
            threshold || 0.70
        );

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Duplicate detection error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Duplicate detection failed."
        });
    }
});

/*
|--------------------------------------------------------------------------
| MATCH UNIVERSITIES + INDUSTRIES
|--------------------------------------------------------------------------
*/

router.post("/match-entities", protect, async (req, res) => {
    try {
        const { challenge } = req.body;

        if (!challenge) {
            return res.status(400).json({
                success: false,
                error: "challenge is required."
            });
        }

        const universities = await University.find({
            verificationStatus: "Verified"
        }).lean();

        const industries = await Industry.find({
            verificationStatus: "Verified"
        }).lean();

        const aiChallenge = {
            ...challenge,
            category:
                categoryToAI[challenge.category] ||
                challenge.category ||
                "Infrastructure"
        };

        const matches = matchUniversitiesAndIndustries(
            aiChallenge,
            universities,
            industries
        );

        return res.json({
            success: true,
            data: matches
        });
    } catch (error) {
        console.error("Entity matching error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Entity matching failed."
        });
    }
});

/*
|--------------------------------------------------------------------------
| ROUTE AUTHORITY
|--------------------------------------------------------------------------
*/

router.post("/route-authority", protect, async (req, res) => {
    try {
        const { challenge } = req.body;

        if (!challenge) {
            return res.status(400).json({
                success: false,
                error: "challenge is required."
            });
        }

        const authorities = await Authority.find().lean();

        const aiChallenge = {
            ...challenge,
            category:
                categoryToAI[challenge.category] ||
                challenge.category ||
                "Infrastructure"
        };

        const routing = routeAuthority(
            aiChallenge,
            authorities
        );

        return res.json({
            success: true,
            data: routing
        });
    } catch (error) {
        console.error("Authority routing error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Authority routing failed."
        });
    }
});

/*
|--------------------------------------------------------------------------
| STANDALONE COMPLETE AI PIPELINE
|--------------------------------------------------------------------------
*/

router.post("/pipeline", async (req, res) => {
    try {
        const { complaint, existingComplaints, universities, industries, authorities } = req.body;
        if (!complaint) {
            return res.status(400).json({
                success: false,
                error: "complaint payload is required."
            });
        }
        const result = processPipeline(
            complaint,
            existingComplaints || [],
            universities || [],
            industries || [],
            authorities || []
        );
        return res.json(result);
    } catch (error) {
        console.error("AI standalone pipeline error:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "AI standalone pipeline failed."
        });
    }
});

/*
|--------------------------------------------------------------------------
| COMPLETE AI PIPELINE (BY COMPLAINT ID)
|--------------------------------------------------------------------------
*/

router.post("/pipeline/:complaintId", protect, async (req, res) => {
    try {
        const { complaintId } = req.params;

        /*
        |--------------------------------------------------------------------------
        | Load complaint
        |--------------------------------------------------------------------------
        */

        const complaint = await Complaint.findById(complaintId).lean();

        if (!complaint) {
            return res.status(404).json({
                success: false,
                error: "Complaint not found."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | AI analysis
        |--------------------------------------------------------------------------
        */

        const aiInput = {
            ...complaint,
            category:
                categoryToAI[complaint.category] ||
                complaint.category ||
                "Infrastructure"
        };

        const analysis = analyzeComplaint(aiInput);

        const databaseCategory =
            categoryToDatabase[analysis.category] ||
            complaint.category ||
            "urban-infrastructure";

        const databasePriority =
            priorityToDatabase[analysis.priority] || "medium";

        /*
        |--------------------------------------------------------------------------
        | Duplicate detection
        |--------------------------------------------------------------------------
        */

        const existingComplaints = await Complaint.find({
            _id: {
                $ne: complaint._id
            }
        }).lean();

        const duplicateDetection = detectDuplicates(
            complaint,
            existingComplaints,
            0.70
        );

        /*
        |--------------------------------------------------------------------------
        | Determine challenge source
        |--------------------------------------------------------------------------
        */

        let challengeSourceComplaint = complaint;

        if (
            duplicateDetection.isDuplicate &&
            duplicateDetection.matchedComplaint
        ) {
            challengeSourceComplaint =
                duplicateDetection.matchedComplaint;
        }

        /*
        |--------------------------------------------------------------------------
        | Load institutions
        |--------------------------------------------------------------------------
        */

        const universities = await University.find({
            verificationStatus: "Verified"
        }).lean();

        const industries = await Industry.find({
            verificationStatus: "Verified"
        }).lean();

        const authorities = await Authority.find().lean();

        /*
        |--------------------------------------------------------------------------
        | Match universities + industries
        |--------------------------------------------------------------------------
        */

        const challengeForAI = {
            title: challengeSourceComplaint.title,
            description: challengeSourceComplaint.description,
            category: analysis.category,
            location: challengeSourceComplaint.location || "",
            priority: analysis.priority,
            requiredExpertise: analysis.requiredExpertise
        };

        const entityMatches = matchUniversitiesAndIndustries(
            challengeForAI,
            universities,
            industries
        );

        /*
        |--------------------------------------------------------------------------
        | Route authority
        |--------------------------------------------------------------------------
        */

        const authorityRouting = routeAuthority(
            challengeForAI,
            authorities
        );

        /*
        |--------------------------------------------------------------------------
        | Find existing challenge
        |--------------------------------------------------------------------------
        */

        let challenge = await Challenge.findOne({
            linkedGrievance: challengeSourceComplaint._id
        });

        /*
        |--------------------------------------------------------------------------
        | Create challenge
        |--------------------------------------------------------------------------
        */

        if (!challenge) {
            challenge = await Challenge.create({
                title: challengeSourceComplaint.title,
                description: challengeSourceComplaint.description,

                linkedGrievance: challengeSourceComplaint._id,

                assignedDepartment:
                    authorityRouting.assignedDepartment,

                matchedUniversity:
                    entityMatches.topUniversityMatch
                        ? entityMatches.topUniversityMatch.universityId
                        : null,

                industrySponsor:
                    entityMatches.topIndustrySponsor
                        ? entityMatches.topIndustrySponsor.industryId
                        : null,

                status: "Open for Matching",

                requiredExpertise:
                    analysis.requiredExpertise,

                supportNeeded:
                    entityMatches.topIndustrySponsor
                        ? entityMatches.topIndustrySponsor.supportOffered || []
                        : []
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Update complaint
        |--------------------------------------------------------------------------
        */

        await Complaint.findByIdAndUpdate(
            complaint._id,
            {
                category: databaseCategory,
                priority: databasePriority,
                status: duplicateDetection.isDuplicate
                    ? "consolidated"
                    : "matched"
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Final response
        |--------------------------------------------------------------------------
        */

        return res.json({
            success: true,

            message:
                duplicateDetection.isDuplicate
                    ? "Complaint analyzed and consolidated with an existing community issue."
                    : "Complaint analyzed and converted into an actionable challenge.",

            pipeline: {
                complaintId: complaint._id,

                aiAnalysis: {
                    ...analysis,
                    category: databaseCategory,
                    priority: databasePriority
                },

                duplicateDetection,

                challenge,

                universityMatch:
                    entityMatches.topUniversityMatch,

                industryMatch:
                    entityMatches.topIndustrySponsor,

                authorityRouting
            }
        });
    } catch (error) {
        console.error("AI pipeline error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "AI pipeline failed."
        });
    }
});

module.exports = router;