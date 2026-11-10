const mongoose = require("mongoose");

const Collaboration = require("../models/Collaboration");
const Complaint = require("../models/Complaint");
const University = require("../models/University");
const Industry = require("../models/Industry");
const User = require("../models/User");

// Get the organization linked to the logged-in account.
async function getOrganization(user) {
    if (!user || !user.userId) {
        return null;
    }

    const account = await User.findById(user.userId);

    if (
        !account ||
        !account.organizationId ||
        !account.organizationType
    ) {
        return null;
    }

    let organization;

    if (account.organizationType === "University") {
        organization = await University.findById(
            account.organizationId
        );
    } else if (account.organizationType === "Industry") {
        organization = await Industry.findById(
            account.organizationId
        );
    }

    if (!organization || organization.verificationStatus !== "Verified" || !account.isVerified) {
        return null;
    }

    return {
        id: organization._id,
        type: account.organizationType,
        organization
    };
}

// List invitations involving the logged-in organization.
exports.getCollaborations = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(401).json({
                message: "User account not found."
            });
        }

        if (
            !["authority", "university", "industry"].includes(
                user.role
            )
        ) {
            return res.status(403).json({
                message: "You are not allowed to view collaborations."
            });
        }

        let filter = {};

        if (user.role !== "authority") {
            const organization = await getOrganization(req.user);

            if (!organization) {
                return res.status(400).json({
                    message:
                        "Your account is not linked to an organization. Ask an authority to link it first."
                });
            }

            filter = {
                $or: [
                    {
                        initiatorOrganizationId: organization.id,
                        initiatorOrganizationType: organization.type
                    },
                    {
                        partnerOrganizationId: organization.id,
                        partnerOrganizationType: organization.type
                    }
                ]
            };
        }

        const collaborations = await Collaboration.find(filter)
            .populate("complaint", "title category location status")
            .populate("initiatedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json(collaborations);
    } catch (error) {
        console.error("Get collaborations error:", error);

        return res.status(500).json({
            message: "Failed to fetch collaborations."
        });
    }
};

// Invite a partner organization to collaborate on a complaint.
exports.createCollaboration = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (
            !user ||
            !["university", "industry"].includes(user.role)
        ) {
            return res.status(403).json({
                message:
                    "Only university and industry accounts can invite partners."
            });
        }

        const organization = await getOrganization(req.user);

        if (!organization) {
            return res.status(400).json({
                message:
                    "Your account is not linked to an organization. Ask an authority to link it first."
            });
        }

        const {
            complaintId,
            partnerOrganizationId,
            partnerOrganizationType
        } = req.body || {};

        if (
            !mongoose.isValidObjectId(complaintId) ||
            !mongoose.isValidObjectId(partnerOrganizationId) ||
            !["University", "Industry"].includes(
                partnerOrganizationType
            )
        ) {
            return res.status(400).json({
                message:
                    "Valid complaint and partner organization details are required."
            });
        }

        if (partnerOrganizationType === organization.type) {
            return res.status(400).json({
                message: "Choose an organization of the other type."
            });
        }

        if (
            String(organization.id) ===
            String(partnerOrganizationId)
        ) {
            return res.status(400).json({
                message: "You cannot invite your own organization."
            });
        }

        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found."
            });
        }

        // Verify both the assigned organization type and exact ID.
        if (
            complaint.assignedTo !== organization.type ||
            !complaint.assignedEntity ||
            String(complaint.assignedEntity) !==
                String(organization.id)
        ) {
            return res.status(403).json({
                message:
                    "This complaint is not assigned to your organization."
            });
        }

        const PartnerModel =
            partnerOrganizationType === "University"
                ? University
                : Industry;

        const partner = await PartnerModel.findById(
            partnerOrganizationId
        );

        if (
            !partner ||
            partner.verificationStatus !== "Verified"
        ) {
            return res.status(400).json({
                message: "The partner must exist and be verified."
            });
        }

        // Avoid duplicate active invitations for the same complaint
        // and organization pair, regardless of invitation direction.
        const existing = await Collaboration.findOne({
            complaint: complaintId,
            status: { $in: ["pending", "accepted"] },
            $or: [
                {
                    initiatorOrganizationId: organization.id,
                    initiatorOrganizationType: organization.type,
                    partnerOrganizationId,
                    partnerOrganizationType
                },
                {
                    initiatorOrganizationId: partnerOrganizationId,
                    initiatorOrganizationType:
                        partnerOrganizationType,
                    partnerOrganizationId: organization.id,
                    partnerOrganizationType: organization.type
                }
            ]
        });

        if (existing) {
            return res.status(409).json({
                message:
                    "An active invitation or collaboration already exists."
            });
        }

        const collaboration = await Collaboration.create({
            complaint: complaintId,
            initiatedBy: user._id,
            initiatorOrganizationId: organization.id,
            initiatorOrganizationType: organization.type,
            partnerOrganizationId,
            partnerOrganizationType,
            status: "pending"
        });

        const populated = await Collaboration.findById(
            collaboration._id
        )
            .populate("complaint", "title category location status")
            .populate("initiatedBy", "name email");

        return res.status(201).json({
            message: "Collaboration invitation created.",
            collaboration: populated
        });
    } catch (error) {
        console.error("Create collaboration error:", error);

        return res.status(500).json({
            message: "Failed to create collaboration invitation."
        });
    }
};

// Accept or decline an invitation as the invited partner organization.
exports.respondToCollaboration = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (
            !user ||
            !["university", "industry"].includes(user.role)
        ) {
            return res.status(403).json({
                message:
                    "Only university and industry accounts can respond."
            });
        }

        const organization = await getOrganization(req.user);

        if (!organization) {
            return res.status(400).json({
                message:
                    "Your account is not linked to an organization. Ask an authority to link it first."
            });
        }

        const { decision } = req.body || {};

        if (!["accepted", "declined"].includes(decision)) {
            return res.status(400).json({
                message:
                    "Decision must be accepted or declined."
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid collaboration ID."
            });
        }

        const collaboration = await Collaboration.findById(
            req.params.id
        );

        if (!collaboration) {
            return res.status(404).json({
                message: "Collaboration invitation not found."
            });
        }

        if (
            String(collaboration.partnerOrganizationId) !==
                String(organization.id) ||
            collaboration.partnerOrganizationType !==
                organization.type
        ) {
            return res.status(403).json({
                message: "Only the invited partner can respond."
            });
        }

        if (collaboration.status !== "pending") {
            return res.status(409).json({
                message:
                    "This invitation has already been responded to."
            });
        }

        collaboration.status = decision;
        collaboration.respondedAt = new Date();

        await collaboration.save();

        const populated = await Collaboration.findById(
            collaboration._id
        )
            .populate("complaint", "title category location status")
            .populate("initiatedBy", "name email");

        return res.status(200).json({
            message:
                decision === "accepted"
                    ? "Invitation accepted."
                    : "Invitation declined.",
            collaboration: populated
        });
    } catch (error) {
        console.error("Respond to collaboration error:", error);

        return res.status(500).json({
            message: "Failed to respond to invitation."
        });
    }
};