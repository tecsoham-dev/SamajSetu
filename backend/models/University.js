const mongoose = require("mongoose");

const universitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "University name is required"],
            trim: true
        },

        code: {
            type: String,
            required: [true, "University code / registration ID is required"],
            unique: true,
            trim: true
        },

        location: {
            type: String,
            required: [true, "City / State location is required"],
            trim: true
        },

        departments: [
            {
                type: String,
                trim: true
            }
        ],

        expertise: [
            {
                type: String,
                trim: true
            }
        ],

        researchAreas: [
            {
                type: String,
                trim: true
            }
        ],

        nodalOfficer: {
            name: {
                type: String,
                required: true
            },

            email: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                default: ""
            },

            designation: {
                type: String,
                default: "Head of R&D"
            }
        },

        verificationStatus: {
            type: String,
            enum: ["Pending", "Verified", "Rejected"],
            default: "Pending"
        },

        activeProjectsCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const University = mongoose.model("University", universitySchema);

module.exports = University;