
const User = require("../models/User");
const University = require("../models/University");
const Industry = require("../models/Industry");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// REGISTER USER
const registerUser = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, email, password, role } = body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password ||
            typeof role !== "string" ||
            !role.trim()
        ) {
            return res.status(400).json({
                message: "Please provide a valid name, email, password and role"
            });
        }

        const normalizedRole = role.trim().toLowerCase();

        // Authority accounts cannot be created through public registration.
        // Existing authority accounts can still log in normally.
        if (normalizedRole === "authority") {
            return res.status(403).json({
                message:
                    "Authority accounts cannot be created through public registration. Contact the system administrator."
            });
        }

        const allowedRoles = [
            "citizen",
            "university",
            "industry"
        ];

        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: normalizedRole
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Server error during registration"
        });
    }
};


// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const body = req.body || {};
        const { email, password, role } = body;

        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password ||
            typeof role !== "string" ||
            !role.trim()
        ) {
            return res.status(400).json({
                message: "Please provide a valid email, password and role"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (
            user.role.toLowerCase() !== role.trim().toLowerCase()
        ) {
            return res.status(401).json({
                message: "Selected role does not match your account"
            });
        }

        // Institutional accounts require authority approval, a valid link,
        // and an organisation that is currently verified.
        if (["university", "industry"].includes(user.role)) {
            if (!user.organizationId || !user.organizationType) {
                return res.status(403).json({ message: "Your account is awaiting organisation linking and authority approval." });
            }
            if (!user.isVerified) {
                return res.status(403).json({ message: "Your account is awaiting authority approval." });
            }
            const OrganizationModel = user.organizationType === "University"
                ? University
                : user.organizationType === "Industry" ? Industry : null;
            if (!OrganizationModel) {
                return res.status(403).json({ message: "Your account has an invalid organisation link. Contact the authority." });
            }
            const linkedOrganization = await OrganizationModel.findById(user.organizationId);
            if (!linkedOrganization || linkedOrganization.verificationStatus !== "Verified") {
                return res.status(403).json({ message: "Your linked organisation is not currently verified." });
            }
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured");

            return res.status(500).json({
                message: "Authentication is not configured correctly"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                organizationType: user.organizationType
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Server error during login"
        });
    }
};


// LINK A USER TO A VERIFIED ORGANIZATION
// The route must use protect and authorize("authority").
const linkUserToOrganization = async (req, res) => {
    try {
        const params = req.params || {};
        const body = req.body || {};

        const { id } = params;
        const { organizationId, organizationType } = body;

        if (
            typeof id !== "string" ||
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (
            typeof organizationId !== "string" ||
            !mongoose.Types.ObjectId.isValid(organizationId)
        ) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (!["University", "Industry"].includes(organizationType)) {
            return res.status(400).json({
                message: "organizationType must be University or Industry"
            });
        }

        const targetUser = await User.findById(id);

        if (!targetUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const expectedRole =
            organizationType === "University"
                ? "university"
                : "industry";

        if (targetUser.role !== expectedRole) {
            return res.status(400).json({
                message: `This organization type requires a ${expectedRole} user`
            });
        }

        const organizationModel =
            organizationType === "University"
                ? University
                : Industry;

        const organization = await organizationModel.findById(
            organizationId
        );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (organization.verificationStatus !== "Verified") {
            return res.status(400).json({
                message: "Only verified organizations can be linked"
            });
        }

        // Prevent silently replacing an existing organization link.
        if (targetUser.organizationId || targetUser.organizationType) {
            const alreadyLinkedToSameOrganization =
                targetUser.organizationId &&
                targetUser.organizationId.toString() ===
                    organization._id.toString() &&
                targetUser.organizationType === organizationType;

            if (alreadyLinkedToSameOrganization) {
                targetUser.isVerified = true;
                await targetUser.save();
                return res.status(200).json({
                    message: "User is already linked to this organization and is approved",
                    user: {
                        id: targetUser._id,
                        name: targetUser.name,
                        email: targetUser.email,
                        role: targetUser.role,
                        organizationId: targetUser.organizationId,
                        organizationType: targetUser.organizationType
                    }
                });
            }

            return res.status(409).json({
                message: "User is already linked to an organization. Reassignment requires a separate authorized process."
            });
        }

        targetUser.organizationId = organization._id;
        targetUser.organizationType = organizationType;
        targetUser.isVerified = true;

        await targetUser.save();

        return res.status(200).json({
            message: "User linked to organization successfully",
            user: {
                id: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
                role: targetUser.role,
                organizationId: targetUser.organizationId,
                organizationType: targetUser.organizationType
            }
        });
    } catch (error) {
        console.error("Organization linking error:", error.message);

        return res.status(500).json({
            message: "Server error while linking user to organization"
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    linkUserToOrganization
};
