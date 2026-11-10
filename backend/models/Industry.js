const mongoose = require("mongoose");

const industrySchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true
        },

        registrationNo: {
            type: String,
            trim: true,
            default: ""
        },

        sector: [
            {
                type: String,
                trim: true
            }
        ],

        headquarters: {
            type: String,
            required: [true, "Headquarters location is required"],
            trim: true
        },

        supportOffered: [
            {
                type: String,
                enum: [
                    "Mentorship",
                    "Funding / CSR Grant",
                    "Prototyping Lab",
                    "Technology Stack",
                    "Equipment"
                ]
            }
        ],

        csrBudget: {
            type: String,
            default: "Available on request"
        },

        contactPerson: {
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
                default: "CSR Lead / Technical Director"
            }
        },

        verificationStatus: {
            type: String,
            enum: ["Pending", "Verified", "Rejected"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

const Industry = mongoose.model("Industry", industrySchema);

module.exports = Industry;