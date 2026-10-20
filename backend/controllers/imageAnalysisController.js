const { analyzeImage } = require("../services/imageAnalysisService");

/**
 * Controller for Standalone Image Analysis
 * Accepts image file upload, performs genuine image binary & visual feature analysis,
 * and returns imageAnalysisResults.
 */
const analyzeImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No image file provided. Please attach an image file under the 'image' field."
            });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        const analysisResults = await analyzeImage(req.file.path);

        return res.status(200).json({
            message: "Image analyzed successfully",
            imageUrl: imagePath,
            imageAnalysisResults: analysisResults
        });
    } catch (error) {
        console.error("Image analysis controller error:", error.message);
        return res.status(500).json({
            message: error.message || "Server error while performing image analysis"
        });
    }
};

module.exports = {
    analyzeImageUpload
};
