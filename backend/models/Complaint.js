const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            enum: [
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
            ]
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        latitude: {
            type: Number
        },

        longitude: {
            type: Number
        },

        imageUrl: {
            type: String,
            default: ""
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: [
                "reported",
                "validated",
                "consolidated",
                "matched",
                "accepted",
                "in-progress",
                "resolved"
            ],
            default: "reported"
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },

        // Assignment information (from backend-workflow)
        assignedTo: {
            type: String,
            enum: ["University", "Industry"],
            default: null
        },

        assignedEntity: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        // Structured Vision AI findings
        imageAnalysisResults: [
            {
                tag: {
                    type: String,
                    trim: true
                },
                confidence: {
                    type: Number,
                    default: null
                },
                heuristicConfidence: {
                    type: Number,
                    default: null
                },
                confidenceType: {
                    type: String,
                    trim: true
                },
                category: {
                    type: String,
                    trim: true
                },
                description: {
                    type: String,
                    trim: true
                },
                detectedObjects: [
                    {
                        type: String,
                        trim: true
                    }
                ]
            }
        ],

        // Comprehensive Structured AI Analysis & Organization Recommendations
        aiAnalysis: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Complaint", complaintSchema);