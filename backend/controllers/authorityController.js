const Authority = require("../models/Authority");

// GET ALL AUTHORITIES
const getAuthorities = async (req, res) => {
    try {
        const authorities = await Authority.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: authorities.length,
            authorities
        });

    } catch (error) {
        console.error("Get authorities error:", error.message);

        res.status(500).json({
            message: "Server error while fetching authorities"
        });
    }
};


// GET ONE AUTHORITY BY ID
const getAuthorityById = async (req, res) => {
    try {
        const authority = await Authority.findById(req.params.id);

        if (!authority) {
            return res.status(404).json({
                message: "Authority not found"
            });
        }

        res.status(200).json({
            authority
        });

    } catch (error) {
        console.error("Get authority error:", error.message);

        res.status(500).json({
            message: "Server error while fetching authority"
        });
    }
};


// CREATE AN AUTHORITY
const createAuthority = async (req, res) => {
    try {
        const {
            departmentName,
            jurisdiction,
            authorityType,
            officialInCharge,
            assignedCategories
        } = req.body;

        if (
            !departmentName ||
            !jurisdiction ||
            !officialInCharge ||
            !officialInCharge.name ||
            !officialInCharge.email
        ) {
            return res.status(400).json({
                message: "Please provide all required authority details"
            });
        }

        const authority = await Authority.create({
            departmentName,
            jurisdiction,
            authorityType,
            officialInCharge,
            assignedCategories
        });

        res.status(201).json({
            message: "Authority created successfully",
            authority
        });

    } catch (error) {
        console.error("Create authority error:", error.message);

        res.status(500).json({
            message: "Server error while creating authority"
        });
    }
};


// UPDATE AUTHORITY
const updateAuthority = async (req, res) => {
    try {
        const allowedFields = ["departmentName", "jurisdiction", "authorityType", "officialInCharge", "assignedCategories"];
        const update = {};
        for (const field of allowedFields) {
            if (req.body && req.body[field] !== undefined) update[field] = req.body[field];
        }
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "No permitted update fields supplied" });
        }
        const authority = await Authority.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );

        if (!authority) {
            return res.status(404).json({
                message: "Authority not found"
            });
        }

        res.status(200).json({
            message: "Authority updated successfully",
            authority
        });

    } catch (error) {
        console.error("Update authority error:", error.message);

        res.status(500).json({
            message: "Server error while updating authority"
        });
    }
};


module.exports = {
    getAuthorities,
    getAuthorityById,
    createAuthority,
    updateAuthority
};