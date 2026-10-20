const University = require("../models/University");
const Industry = require("../models/Industry");

/**
 * Clean & tokenize text into normalized word stems
 */
function tokenize(text) {
    if (!text || typeof text !== "string") return [];
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 2);
}

/**
 * Calculate Jaccard Token Similarity (0.00 to 1.00)
 */
function calculateJaccardSimilarity(textA, textB) {
    const tokensA = new Set(tokenize(textA));
    const tokensB = new Set(tokenize(textB));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    const intersection = new Set([...tokensA].filter((token) => tokensB.has(token)));
    const union = new Set([...tokensA, ...tokensB]);

    return intersection.size / union.size;
}

/**
 * Generates structured AI output for SamajSetu complaints by combining text and image analysis,
 * and performing dynamic database matching strictly against VERIFIED University & Industry collections.
 * 
 * Heuristic Ranking Score Formulas:
 * ---------------------------------
 * 1. University Match:
 *    - Expertise Overlap Weight: 70% (0.70)
 *    - Jaccard Text Similarity Weight: 30% (0.30)
 *    - Total Weights: 100% (1.00)
 *    - Formula: score = (matchedCount / totalRequired) * 0.70 + (jaccardSim * 0.30)
 *    - Minimum Inclusion Threshold: >= 0.10
 * 
 * 2. Industry Partner Match:
 *    - Sector Match Weight: 50% (0.50)
 *    - Support Capability Match Weight: 30% (0.30)
 *    - Jaccard Text Similarity Weight: 20% (0.20)
 *    - Total Weights: 100% (1.00)
 *    - Formula: score = (sectorMatched ? 0.50 : 0.0) + (matchedCapCount / totalOffered) * 0.30 + (jaccardSim * 0.20)
 *    - Minimum Inclusion Threshold: >= 0.10
 * 
 * All scores are clamped strictly to the range [0.00, 1.00] and represent heuristic rankings.
 */
async function generateStructuredAiAnalysis({ title, description, location, category, imageAnalysisResults }) {
    const safeTitle = typeof title === "string" ? title : "";
    const safeDescription = typeof description === "string" ? description : "";
    const safeLocation = typeof location === "string" ? location : "";
    const submittedCategory = typeof category === "string" ? category.toLowerCase().trim() : "";

    const fullText = `${safeTitle} ${safeDescription} ${safeLocation}`.toLowerCase();
    
    // Server-generated vision tags (only include if provided by server-side analyzeImage)
    const visionTags = Array.isArray(imageAnalysisResults)
        ? imageAnalysisResults.map(r => (r && typeof r.tag === "string" ? r.tag : "")).join(" ")
        : "";
    const visionObjects = Array.isArray(imageAnalysisResults) && imageAnalysisResults[0] && Array.isArray(imageAnalysisResults[0].detectedObjects)
        ? imageAnalysisResults[0].detectedObjects.filter(o => typeof o === "string").join(" ")
        : "";
    const combinedText = `${fullText} ${visionTags} ${visionObjects}`.toLowerCase();

    // 1. Predicted Category Classification
    let predictedCategory = "urban-infrastructure";
    if (combinedText.includes("school") || combinedText.includes("educat") || combinedText.includes("classroom") || combinedText.includes("student")) {
        predictedCategory = "education";
    } else if (combinedText.includes("water") || combinedText.includes("pipe") || combinedText.includes("drain") || combinedText.includes("flood") || combinedText.includes("leakage") || combinedText.includes("waterlogging")) {
        predictedCategory = "water";
    } else if (combinedText.includes("garbage") || combinedText.includes("waste") || combinedText.includes("trash") || combinedText.includes("dump") || combinedText.includes("sanitation")) {
        predictedCategory = "sanitation";
    } else if (combinedText.includes("wire") || combinedText.includes("light") || combinedText.includes("pole") || combinedText.includes("electric") || combinedText.includes("lamp")) {
        predictedCategory = "public-service";
    } else if (combinedText.includes("health") || combinedText.includes("hospital") || combinedText.includes("clinic")) {
        predictedCategory = "healthcare";
    } else if (combinedText.includes("park") || combinedText.includes("tree") || combinedText.includes("pollution") || combinedText.includes("environment")) {
        predictedCategory = "environment";
    } else if (combinedText.includes("farm") || combinedText.includes("crop") || combinedText.includes("agri")) {
        predictedCategory = "agriculture";
    } else if (combinedText.includes("rural") || combinedText.includes("village") || combinedText.includes("livelihood")) {
        predictedCategory = "rural-livelihood";
    } else if (combinedText.includes("ramp") || combinedText.includes("wheelchair") || combinedText.includes("access")) {
        predictedCategory = "accessibility";
    }

    // Category reconciliation: Citizen's submitted category is authoritative if valid.
    const isCategoryMatched = Boolean(submittedCategory && submittedCategory === predictedCategory);

    // 2. Subcategory Extraction
    let subcategory = "General Infrastructure Repair";
    if (predictedCategory === "water" || combinedText.includes("leakage") || combinedText.includes("waterlogging") || combinedText.includes("pipeline")) {
        subcategory = "Urban Waterlogging & Pipeline Leakage";
    } else if (predictedCategory === "education" || combinedText.includes("school") || combinedText.includes("classroom")) {
        subcategory = "Educational Facilities & School Infrastructure Defect";
    } else if (predictedCategory === "sanitation" || combinedText.includes("garbage") || combinedText.includes("waste")) {
        subcategory = "Solid Waste Accumulation & Overflow";
    } else if (predictedCategory === "public-service" || combinedText.includes("wire") || combinedText.includes("electric") || combinedText.includes("light")) {
        subcategory = "Hazardous Wiring & Street Lighting Defect";
    } else if (combinedText.includes("pothole") || combinedText.includes("hole") || combinedText.includes("road") || combinedText.includes("asphalt") || combinedText.includes("crack")) {
        subcategory = "Road Surface Pothole & Fracture";
    }

    // 3. Priority Auto-Scoring
    let priority = "medium";
    const criticalKeywords = ["hazard", "danger", "emergency", "sparking", "collapse", "severe", "overflow", "toxic"];
    const highKeywords = ["pothole", "blocked", "heavy", "broken", "dark", "traffic", "leakage", "burst", "waterlogging"];
    
    if (criticalKeywords.some(k => combinedText.includes(k))) {
        priority = "critical";
    } else if (highKeywords.some(k => combinedText.includes(k))) {
        priority = "high";
    }

    // 4. Affected Groups Identification
    const affectedGroupsSet = new Set();
    if (predictedCategory === "education" || combinedText.includes("school") || combinedText.includes("children") || combinedText.includes("student")) {
        affectedGroupsSet.add("School Children & Students");
        affectedGroupsSet.add("Teaching Staff");
    }
    if (combinedText.includes("commuter") || combinedText.includes("road") || combinedText.includes("traffic") || combinedText.includes("vehicle") || combinedText.includes("asphalt")) {
        affectedGroupsSet.add("Daily Commuters");
        affectedGroupsSet.add("Vehicle Owners");
    }
    if (combinedText.includes("resident") || combinedText.includes("colony") || combinedText.includes("street") || combinedText.includes("neighborhood") || combinedText.includes("water")) {
        affectedGroupsSet.add("Local Residents");
    }
    if (combinedText.includes("shop") || combinedText.includes("market") || combinedText.includes("business")) {
        affectedGroupsSet.add("Local Businesses & Pedestrians");
    }
    if (affectedGroupsSet.size === 0) {
        affectedGroupsSet.add("Local Residents");
        affectedGroupsSet.add("Pedestrians");
    }
    const affectedGroups = Array.from(affectedGroupsSet);

    // 5. Required Expertise Tags Generation
    const expertiseSet = new Set();
    if (predictedCategory === "urban-infrastructure" || combinedText.includes("road") || combinedText.includes("pothole")) {
        expertiseSet.add("Civil Engineering");
        expertiseSet.add("Road Infrastructure");
        expertiseSet.add("Structural Integrity");
        expertiseSet.add("Asphalt & Pavement Materials");
    } else if (predictedCategory === "water" || combinedText.includes("water") || combinedText.includes("pipe") || combinedText.includes("leakage")) {
        expertiseSet.add("Water Resource Management");
        expertiseSet.add("Hydraulics & Piping");
        expertiseSet.add("Environmental Engineering");
        expertiseSet.add("Urban Drainage Systems");
    } else if (predictedCategory === "education" || combinedText.includes("school") || combinedText.includes("educat")) {
        expertiseSet.add("Educational Infrastructure");
        expertiseSet.add("Civil Engineering");
        expertiseSet.add("Pedagogical Facilities");
        expertiseSet.add("Child Safety Standards");
    } else if (predictedCategory === "sanitation" || combinedText.includes("waste") || combinedText.includes("garbage")) {
        expertiseSet.add("Waste Management & Recycling");
        expertiseSet.add("Environmental Engineering");
    } else if (predictedCategory === "public-service" || combinedText.includes("wire") || combinedText.includes("light")) {
        expertiseSet.add("Electrical Engineering");
        expertiseSet.add("IoT Smart Lighting");
    }
    if (expertiseSet.size === 0) {
        expertiseSet.add("Civic Infrastructure");
        expertiseSet.add("Urban Engineering");
    }
    const requiredExpertise = Array.from(expertiseSet);

    // 6. Summary Generation
    const locStr = safeLocation ? ` at ${safeLocation}` : "";
    const summary = `AI Analysis: Identified ${predictedCategory} issue (${subcategory})${locStr}. Flagged as ${priority} priority. Affecting ${affectedGroups.join(", ")}.`;

    // 7. Dynamic Database Matching for Universities (Strictly VERIFIED organizations only)
    let universityRecommendations = [];
    try {
        const universities = await University.find({ verificationStatus: "Verified" });
        if (universities && universities.length > 0) {
            universityRecommendations = universities
                .map(uni => {
                    const uniDepts = Array.isArray(uni.departments) ? uni.departments.filter(d => typeof d === "string") : [];
                    const uniExp = Array.isArray(uni.expertise) ? uni.expertise.filter(e => typeof e === "string") : [];
                    const uniResearch = Array.isArray(uni.researchAreas) ? uni.researchAreas.filter(r => typeof r === "string") : [];
                    const uniTags = [...uniDepts, ...uniExp, ...uniResearch];
                    
                    const matchedExpSet = new Set();
                    requiredExpertise.forEach(reqTag => {
                        const isMatch = uniTags.some(t => t.toLowerCase().includes(reqTag.toLowerCase()) || reqTag.toLowerCase().includes(t.toLowerCase()));
                        if (isMatch) matchedExpSet.add(reqTag);
                    });

                    const uniText = `${uni.name || ""} ${uniTags.join(" ")}`.toLowerCase();
                    const jaccard = calculateJaccardSimilarity(combinedText, uniText);
                    const overlapCount = matchedExpSet.size;
                    const matchFraction = requiredExpertise.length > 0 ? overlapCount / requiredExpertise.length : 0;

                    // Weights: 70% expertise overlap + 30% text similarity (Total: 100%)
                    let rawScore = 0;
                    if (overlapCount > 0 || jaccard > 0.05) {
                        rawScore = (matchFraction * 0.70) + (jaccard * 0.30);
                    }

                    // Clamp to [0.00, 1.00]
                    const clampedScore = Math.max(0.0, Math.min(1.0, Math.round(rawScore * 100) / 100));

                    return {
                        universityId: uni._id,
                        name: uni.name || "University Partner",
                        matchScore: clampedScore,
                        matchedExpertise: Array.from(matchedExpSet)
                    };
                })
                .filter(rec => rec.matchScore >= 0.10 && rec.matchedExpertise.length > 0); // Minimum 0.10 threshold

            universityRecommendations.sort((a, b) => b.matchScore - a.matchScore);
        }
    } catch (err) {
        console.warn("University DB matching warning:", err.message);
    }

    // 8. Dynamic Database Matching for Industry Partners (Strictly VERIFIED organizations only)
    let industryRecommendations = [];
    try {
        const industries = await Industry.find({ verificationStatus: "Verified" });
        if (industries && industries.length > 0) {
            industryRecommendations = industries
                .map(ind => {
                    const sectors = Array.isArray(ind.sector) ? ind.sector.filter(s => typeof s === "string") : [];
                    const supports = Array.isArray(ind.supportOffered) ? ind.supportOffered.filter(s => typeof s === "string") : [];
                    const indTags = [...sectors, ...supports];

                    const matchedSectors = new Set();
                    sectors.forEach(sec => {
                        const secLower = sec.toLowerCase();
                        const catMatch = secLower.includes(predictedCategory.toLowerCase()) || predictedCategory.toLowerCase().includes(secLower);
                        const expMatch = requiredExpertise.some(exp => exp.toLowerCase().includes(secLower) || secLower.includes(exp.toLowerCase()));
                        if (catMatch || expMatch) {
                            matchedSectors.add(sec);
                        }
                    });

                    const matchedCapabilities = new Set();
                    supports.forEach(sup => {
                        const supLower = sup.toLowerCase();
                        const isRelevant = combinedText.includes(supLower) ||
                            requiredExpertise.some(exp => exp.toLowerCase().includes(supLower) || supLower.includes(exp.toLowerCase())) ||
                            (supLower.includes("equipment") && (combinedText.includes("pothole") || combinedText.includes("road") || combinedText.includes("pipe") || combinedText.includes("machin") || combinedText.includes("repair") || combinedText.includes("infra"))) ||
                            (supLower.includes("grant") || supLower.includes("funding")) ||
                            (supLower.includes("technology") && (combinedText.includes("water") || combinedText.includes("iot") || combinedText.includes("sensor") || combinedText.includes("detect")));
                        if (isRelevant) {
                            matchedCapabilities.add(sup);
                        }
                    });

                    const indText = `${ind.companyName || ""} ${indTags.join(" ")}`.toLowerCase();
                    const jaccard = calculateJaccardSimilarity(combinedText, indText);
                    const sectorMatch = matchedSectors.size > 0;

                    // Weights: 50% sector match + 30% support capability fraction + 20% text similarity (Total: 100%)
                    let rawScore = 0;
                    if ((sectorMatch && matchedCapabilities.size > 0) || (sectorMatch && jaccard > 0.03) || jaccard > 0.05) {
                        const sectorScore = sectorMatch ? 0.50 : 0.0;
                        const capFraction = supports.length > 0 ? (matchedCapabilities.size / supports.length) : 0.0;
                        const capScore = capFraction * 0.30;
                        const simScore = jaccard * 0.20;
                        rawScore = sectorScore + capScore + simScore;
                    }

                    // Clamp to [0.00, 1.00]
                    const clampedScore = Math.max(0.0, Math.min(1.0, Math.round(rawScore * 100) / 100));

                    return {
                        industryId: ind._id,
                        companyName: ind.companyName || "Industry Partner",
                        matchScore: clampedScore,
                        matchedSectors: Array.from(matchedSectors),
                        matchedCapabilities: Array.from(matchedCapabilities)
                    };
                })
                .filter(rec => rec.matchScore >= 0.10 && (rec.matchedSectors.length > 0 || rec.matchedCapabilities.length > 0)); // Minimum 0.10 threshold

            industryRecommendations.sort((a, b) => b.matchScore - a.matchScore);
        }
    } catch (err) {
        console.warn("Industry DB matching warning:", err.message);
    }

    return {
        category: submittedCategory || predictedCategory,
        predictedCategory,
        categoryMatch: isCategoryMatched,
        subcategory,
        priority,
        summary,
        affectedGroups,
        requiredExpertise,
        universityRecommendations,
        industryRecommendations
    };
}

module.exports = {
    generateStructuredAiAnalysis
};
