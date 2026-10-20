require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const universityRoutes = require("./routes/universityRoutes");
const industryRoutes = require("./routes/industryRoutes");
const authorityRoutes = require("./routes/authorityRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const aiRoutes = require("./ai/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/industries", industryRoutes);
app.use("/api/authorities", authorityRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/collaborations", collaborationRoutes);
app.use("/api/ai", aiRoutes);

connectDB();

app.get("/", (req, res) => {
    res.json({
        message: "SamajSetu Backend is running!"
    });
});

app.listen(process.env.PORT || 5000, () => {
    console.log(
        `SamajSetu backend running on port ${process.env.PORT || 5000}`
    );
});