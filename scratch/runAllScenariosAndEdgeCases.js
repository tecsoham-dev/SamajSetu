const path = require("path");
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });

const fs = require("fs");
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
const express = require(path.join(__dirname, "../backend/node_modules/express"));
const FormData = require(path.join(__dirname, "../backend/node_modules/form-data"));
const http = require("http");

// Load backend models
const User = require("../backend/models/User");
const University = require("../backend/models/University");
const Industry = require("../backend/models/Industry");
const Complaint = require("../backend/models/Complaint");

// Load backend routes
const complaintRoutes = require("../backend/routes/complaintRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../backend/uploads")));
app.use("/api/complaints", complaintRoutes);

const JWT_SECRET = process.env.JWT_SECRET || "samajsetu_secret_key_2026";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/samajsetu_test";

const testImagePath = path.join(__dirname, "test_assets/real_pothole.jpg");
if (!fs.existsSync(testImagePath)) {
    fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
    const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9]);
    fs.writeFileSync(testImagePath, buf);
}

async function runTestSuite() {
    console.log("================================================================================");
    console.log("SAMAJSETU AI & BACKEND INTEGRATION TEST SUITE");
    console.log("Testing 3 Primary Civic Scenarios + 4 Required Edge Cases");
    console.log("================================================================================\n");

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✔ Connected to MongoDB for testing.");
    } catch (e) {
        console.error("❌ MongoDB connection error:", e.message);
        process.exit(1);
    }

    // 1. Seed test Citizen User
    let citizenUser = await User.findOne({ email: "testcitizen@samajsetu.org" });
    if (!citizenUser) {
        citizenUser = await User.create({
            name: "Test Citizen",
            email: "testcitizen@samajsetu.org",
            password: "password123",
            role: "citizen"
        });
    }

    const citizenToken = jwt.sign(
        { userId: citizenUser._id, role: citizenUser.role },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    // 2. Seed verified & unverified Universities (Matching schema validation rules)
    await University.deleteMany({ code: { $in: ["TEST-UNI-CIVIL", "TEST-UNI-WATER", "TEST-UNI-PENDING"] } });
    
    const verifiedUniCivil = await University.create({
        name: "Delhi Institute of Civil Infrastructure",
        code: "TEST-UNI-CIVIL",
        location: "Delhi NCR",
        verificationStatus: "Verified",
        departments: ["Civil Engineering", "Structural Engineering", "Urban Planning"],
        expertise: ["Road Infrastructure", "Asphalt Materials", "Civil Engineering"],
        researchAreas: ["Urban Road Resilience", "Structural Integrity"],
        nodalOfficer: {
            name: "Dr. A. K. Sharma",
            email: "civil.nodal@test.edu",
            designation: "Head of R&D"
        }
    });

    const verifiedUniWater = await University.create({
        name: "National Institute of Water Hydrology",
        code: "TEST-UNI-WATER",
        location: "Roorkee",
        verificationStatus: "Verified",
        departments: ["Hydraulics Engineering", "Environmental Engineering"],
        expertise: ["Water Resource Management", "Urban Drainage Systems", "Hydraulics & Piping"],
        researchAreas: ["Urban Flood Prevention", "Potable Water Quality"],
        nodalOfficer: {
            name: "Dr. S. Verma",
            email: "water.nodal@test.edu",
            designation: "Head of Water Research"
        }
    });

    const unverifiedUni = await University.create({
        name: "Unverified Road Academy (Pending)",
        code: "TEST-UNI-PENDING",
        location: "Unknown",
        verificationStatus: "Pending", // Should NEVER be recommended
        departments: ["Civil Engineering"],
        expertise: ["Road Infrastructure"],
        nodalOfficer: {
            name: "Pending Officer",
            email: "pending.nodal@test.edu"
        }
    });

    // 3. Seed verified & unverified Industries (Matching schema enums)
    await Industry.deleteMany({ companyName: { $in: ["L&T Urban Infra Solutions", "Aquatech Water Utilities Corp", "Rejected Road Fixers"] } });

    const verifiedIndInfra = await Industry.create({
        companyName: "L&T Urban Infra Solutions",
        headquarters: "Mumbai",
        verificationStatus: "Verified",
        sector: ["urban-infrastructure", "Civil Engineering"],
        supportOffered: ["Equipment", "Funding / CSR Grant", "Mentorship"],
        contactPerson: {
            name: "R. Mehta",
            email: "infra.lead@testcorp.com",
            designation: "CSR Director"
        }
    });

    const verifiedIndWater = await Industry.create({
        companyName: "Aquatech Water Utilities Corp",
        headquarters: "Pune",
        verificationStatus: "Verified",
        sector: ["water", "Water Resource Management"],
        supportOffered: ["Technology Stack", "Funding / CSR Grant", "Equipment"],
        contactPerson: {
            name: "P. Nair",
            email: "water.lead@testcorp.com",
            designation: "CSR Utilities Lead"
        }
    });

    const unverifiedInd = await Industry.create({
        companyName: "Rejected Road Fixers",
        headquarters: "Unknown",
        verificationStatus: "Rejected", // Should NEVER be recommended
        sector: ["urban-infrastructure"],
        supportOffered: ["Equipment"],
        contactPerson: {
            name: "Rejected Person",
            email: "rejected@testcorp.com"
        }
    });

    console.log("✔ Seeded Verified & Unverified Organizations for Isolation Testing.\n");

    const server = app.listen(5098, async () => {
        const testResults = [];

        async function sendRequest({ method, path, headers = {}, body, isMultipart = false }) {
            return new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: "localhost",
                    port: 5098,
                    path,
                    method,
                    headers
                }, (res) => {
                    let data = "";
                    res.on("data", chunk => data += chunk);
                    res.on("end", () => {
                        let parsed;
                        try {
                            parsed = JSON.parse(data);
                        } catch (e) {
                            parsed = data;
                        }
                        resolve({ status: res.statusCode, data: parsed });
                    });
                });

                req.on("error", reject);

                if (isMultipart && body) {
                    body.pipe(req);
                } else if (body) {
                    req.write(typeof body === "string" ? body : JSON.stringify(body));
                    req.end();
                } else {
                    req.end();
                }
            });
        }

        try {
            // TEST 1: Infrastructure Scenario
            console.log("--- [TEST 1] Scenario 1: Road Pothole (Infrastructure) with Real Image ---");
            const form1 = new FormData();
            form1.append("title", "Deep Pothole on Main Arterial Road");
            form1.append("description", "Severe asphalt fracture and deep pothole causing vehicle damage and traffic slowdown.");
            form1.append("category", "urban-infrastructure");
            form1.append("location", "Sector 14 Main Boulevard");
            form1.append("latitude", "28.4595");
            form1.append("longitude", "77.0266");
            form1.append("image", fs.createReadStream(testImagePath));

            const res1 = await sendRequest({
                method: "POST",
                path: "/api/complaints",
                headers: {
                    ...form1.getHeaders(),
                    "Authorization": `Bearer ${citizenToken}`
                },
                body: form1,
                isMultipart: true
            });

            console.log(`Status: ${res1.status}`);
            console.log(`Submitted Category: ${res1.data.complaint ? res1.data.complaint.category : "N/A"}`);
            console.log(`Predicted Category: ${res1.data.aiAnalysis ? res1.data.aiAnalysis.predictedCategory : "N/A"}`);
            console.log(`Category Match: ${res1.data.aiAnalysis ? res1.data.aiAnalysis.categoryMatch : "N/A"}`);
            console.log(`Top University: ${res1.data.aiAnalysis && res1.data.aiAnalysis.universityRecommendations[0] ? res1.data.aiAnalysis.universityRecommendations[0].name + " (Score: " + res1.data.aiAnalysis.universityRecommendations[0].matchScore + ")" : "None"}`);
            console.log(`Top Industry: ${res1.data.aiAnalysis && res1.data.aiAnalysis.industryRecommendations[0] ? res1.data.aiAnalysis.industryRecommendations[0].companyName + " (Score: " + res1.data.aiAnalysis.industryRecommendations[0].matchScore + ")" : "None"}`);
            
            const hasUnverified1 = (res1.data.aiAnalysis.universityRecommendations || []).some(u => String(u.universityId) === String(unverifiedUni._id))
                || (res1.data.aiAnalysis.industryRecommendations || []).some(i => String(i.industryId) === String(unverifiedInd._id));
            console.log(`Unverified Organizations Excluded: ${!hasUnverified1 ? "✔ PASS" : "❌ FAIL"}`);
            testResults.push({ test: "Scenario 1 (Infrastructure)", passed: res1.status === 201 && !hasUnverified1 });

            // TEST 2: Water Scenario
            console.log("\n--- [TEST 2] Scenario 2: Water Pipeline Leakage & Flooding ---");
            const res2 = await sendRequest({
                method: "POST",
                path: "/api/complaints",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${citizenToken}`
                },
                body: {
                    title: "Main Drinking Water Pipeline Burst",
                    description: "High pressure drinking water pipe ruptured causing severe waterlogging and wastage of potable water.",
                    category: "water",
                    location: "Pipeline Ward 8, Green Park",
                    latitude: 28.5582,
                    longitude: 77.2023
                }
            });

            console.log(`Status: ${res2.status}`);
            console.log(`Submitted Category: ${res2.data.complaint ? res2.data.complaint.category : "N/A"}`);
            console.log(`Predicted Category: ${res2.data.aiAnalysis ? res2.data.aiAnalysis.predictedCategory : "N/A"}`);
            console.log(`Top University: ${res2.data.aiAnalysis && res2.data.aiAnalysis.universityRecommendations[0] ? res2.data.aiAnalysis.universityRecommendations[0].name + " (Score: " + res2.data.aiAnalysis.universityRecommendations[0].matchScore + ")" : "None"}`);
            console.log(`Top Industry: ${res2.data.aiAnalysis && res2.data.aiAnalysis.industryRecommendations[0] ? res2.data.aiAnalysis.industryRecommendations[0].companyName + " (Score: " + res2.data.aiAnalysis.industryRecommendations[0].matchScore + ")" : "None"}`);
            testResults.push({ test: "Scenario 2 (Water)", passed: res2.status === 201 && res2.data.complaint.category === "water" });

            // TEST 3: Education Scenario
            console.log("\n--- [TEST 3] Scenario 3: Damaged School Classroom Defect ---");
            const res3 = await sendRequest({
                method: "POST",
                path: "/api/complaints",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${citizenToken}`
                },
                body: {
                    title: "Government Primary School Roof Damaged",
                    description: "Classroom ceiling cracked and hazardous for school children and teachers during rain.",
                    category: "education",
                    location: "School Compound, Village Block 3",
                    latitude: 28.4000,
                    longitude: 77.1000
                }
            });

            console.log(`Status: ${res3.status}`);
            console.log(`Submitted Category: ${res3.data.complaint ? res3.data.complaint.category : "N/A"}`);
            console.log(`Predicted Category: ${res3.data.aiAnalysis ? res3.data.aiAnalysis.predictedCategory : "N/A"}`);
            console.log(`Priority: ${res3.data.complaint ? res3.data.complaint.priority : "N/A"}`);
            testResults.push({ test: "Scenario 3 (Education)", passed: res3.status === 201 && res3.data.complaint.category === "education" });

            // EDGE CASE 1: Unauthorized Request (Missing Token -> 401)
            console.log("\n--- [EDGE CASE 1] Unauthorized Request (No JWT Token) ---");
            const resEdge1 = await sendRequest({
                method: "POST",
                path: "/api/complaints",
                headers: { "Content-Type": "application/json" },
                body: {
                    title: "Anonymous Report",
                    description: "Some issue reported without login.",
                    category: "urban-infrastructure",
                    location: "Downtown"
                }
            });

            console.log(`Status: ${resEdge1.status} (Expected: 401)`);
            console.log(`Message: ${resEdge1.data.message}`);
            testResults.push({ test: "Edge Case 1 (Unauthorized -> 401)", passed: resEdge1.status === 401 });

            // EDGE CASE 2: Invalid Coordinates (Latitude = 150 -> 400)
            console.log("\n--- [EDGE CASE 2] Invalid Coordinates (Latitude = 150) ---");
            const resEdge2 = await sendRequest({
                method: "POST",
                path: "/api/complaints",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${citizenToken}`
                },
                body: {
                    title: "Invalid Geo Coordinate Test",
                    description: "Testing out-of-range coordinates.",
                    category: "urban-infrastructure",
                    location: "North Pole",
                    latitude: 150.0,
                    longitude: 77.0
                }
            });

            console.log(`Status: ${resEdge2.status} (Expected: 400)`);
            console.log(`Message: ${resEdge2.data.message}`);
            testResults.push({ test: "Edge Case 2 (Invalid Latitude -> 400)", passed: resEdge2.status === 400 });

            // EDGE CASE 3: Unverified Organization Exclusion
            console.log("\n--- [EDGE CASE 3] Verified Only Filtering Verification ---");
            const allRecUnis = (res1.data.aiAnalysis.universityRecommendations || []).concat(res2.data.aiAnalysis.universityRecommendations || []);
            const allRecInds = (res1.data.aiAnalysis.industryRecommendations || []).concat(res2.data.aiAnalysis.industryRecommendations || []);
            
            const unverifiedFound = allRecUnis.some(u => String(u.universityId) === String(unverifiedUni._id))
                || allRecInds.some(i => String(i.industryId) === String(unverifiedInd._id));
            
            console.log(`Pending/Rejected Organizations in Recommendations: ${unverifiedFound ? "FOUND (FAIL)" : "NONE FOUND (✔ PASS)"}`);
            testResults.push({ test: "Edge Case 3 (Verified Orgs Only)", passed: !unverifiedFound });

            // EDGE CASE 4: Missing Image Data Safe Fallback
            console.log("\n--- [EDGE CASE 4] Missing Image Data (Graceful Text-Only Fallback) ---");
            const resEdge4 = await sendRequest({
                method: "POST",
                path: "/api/complaints",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${citizenToken}`
                },
                body: {
                    title: "Solid Waste Accumulation",
                    description: "Garbage bin overflowing near market without photo.",
                    category: "sanitation",
                    location: "Market Square"
                }
            });

            console.log(`Status: ${resEdge4.status}`);
            console.log(`Image URL: "${resEdge4.data.complaint ? resEdge4.data.complaint.imageUrl : ""}" (Empty string fallback)`);
            console.log(`Image Analysis Results Length: ${resEdge4.data.complaint ? resEdge4.data.complaint.imageAnalysisResults.length : 0}`);
            testResults.push({ test: "Edge Case 4 (Missing Image Fallback)", passed: resEdge4.status === 201 && resEdge4.data.complaint.imageUrl === "" });

            // SUMMARY
            console.log("\n================================================================================");
            console.log("TEST SUITE EXECUTION SUMMARY:");
            console.log("================================================================================");
            let allPassed = true;
            testResults.forEach(r => {
                console.log(`${r.passed ? "✔ PASS" : "❌ FAIL"} - ${r.test}`);
                if (!r.passed) allPassed = false;
            });
            console.log("================================================================================");
            console.log(allPassed ? "🎉 ALL 7 TESTS PASSED SUCCESSFULLY!" : "❌ SOME TESTS FAILED.");
            console.log("================================================================================\n");

            server.close();
            await mongoose.disconnect();
            process.exit(allPassed ? 0 : 1);

        } catch (err) {
            console.error("❌ Test suite runtime error:", err);
            server.close();
            await mongoose.disconnect();
            process.exit(1);
        }
    });
}

runTestSuite();
