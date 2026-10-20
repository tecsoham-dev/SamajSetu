const fs = require("fs");
const path = require("path");

let tf = null;
let mobilenet = null;
let jpeg = null;
let PNG = null;
let modelPromise = null;

// Dynamically load local TensorFlow MobileNet neural modules if available
try {
    tf = require("@tensorflow/tfjs");
    mobilenet = require("@tensorflow-models/mobilenet");
    jpeg = require("jpeg-js");
    PNG = require("pngjs").PNG;
} catch (e) {
    // Will fall back to HuggingFace Vision API or clean unavailable status
}

function getMobileNetModel() {
    if (!modelPromise && mobilenet) {
        console.log("🤖 Loading open-source MobileNet neural vision model...");
        const loadPromise = mobilenet.load({ version: 2, alpha: 1.0 });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("MobileNet download timeout")), 5000)
        );
        modelPromise = Promise.race([loadPromise, timeoutPromise]).catch(err => {
            console.warn("MobileNet load unavailable, falling back to Vision API:", err.message);
            return null;
        });
    }
    return modelPromise;
}

/**
 * Converts JPEG or PNG binary image buffer to 3D RGB Tensor [height, width, 3]
 */
function bufferToTensor(buffer) {
    if (!tf || !jpeg || !PNG) return null;

    let width, height, data;

    // Check Magic Byte Header
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        // JPEG format
        const rawImageData = jpeg.decode(buffer, { useTArray: true });
        width = rawImageData.width;
        height = rawImageData.height;
        data = rawImageData.data; // RGBA Uint8Array
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        // PNG format
        const png = PNG.sync.read(buffer);
        width = png.width;
        height = png.height;
        data = png.data; // RGBA Uint8Array
    } else {
        throw new Error("Unsupported image format. Only JPEG and PNG formats are supported.");
    }

    const numPixels = width * height;
    const rgbValues = new Int32Array(numPixels * 3);

    for (let i = 0; i < numPixels; i++) {
        rgbValues[i * 3] = data[i * 4];       // Red
        rgbValues[i * 3 + 1] = data[i * 4 + 1]; // Green
        rgbValues[i * 3 + 2] = data[i * 4 + 2]; // Blue
    }

    return tf.tensor3d(rgbValues, [height, width, 3], "int32");
}

/**
 * SamajSetu Real AI Vision Model Engine
 * Integrates open-source prebuilt MobileNet neural model and Hugging Face Vision API.
 */
async function analyzeImage(imageFilePath) {
    if (!imageFilePath || !fs.existsSync(imageFilePath)) {
        return createUnavailableResult("Invalid or unreadable image file path");
    }

    let imageBuffer;
    try {
        imageBuffer = await fs.promises.readFile(imageFilePath);
        if (!imageBuffer || imageBuffer.length === 0) {
            return createUnavailableResult("Uploaded image file is empty");
        }
    } catch (err) {
        return createUnavailableResult("Failed to read image file from disk");
    }

    const fileSizeKB = Math.round(imageBuffer.length / 1024);

    // Attempt 1: Run Local Open-Source MobileNet Neural Model Inference (if packages installed)
    if (tf && mobilenet && jpeg) {
        try {
            const imageTensor = bufferToTensor(imageBuffer);
            if (imageTensor) {
                const model = await getMobileNetModel();
                if (model) {
                    const predictions = await model.classify(imageTensor);
                    imageTensor.dispose(); // clean memory

                    if (predictions && predictions.length > 0) {
                        return mapPredictionsToCivicResults(predictions, fileSizeKB);
                    }
                } else {
                    imageTensor.dispose();
                }
            }
        } catch (localErr) {
            console.warn("Local MobileNet neural model error:", localErr.message);
        }
    }

    // Attempt 2: Call Real HuggingFace Vision AI Model API (Salesforce/blip-image-captioning)
    try {
        const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const endpoints = [
            "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning",
            "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning"
        ];

        let response = null;
        for (const url of endpoints) {
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/octet-stream",
                        ...(hfToken ? { "Authorization": `Bearer ${hfToken}` } : {})
                    },
                    body: imageBuffer,
                    signal: controller.signal
                });
                if (res.ok) {
                    response = res;
                    break;
                }
            } catch (netErr) {
                // Continue to next endpoint
            }
        }
        clearTimeout(timeoutId);

        if (response && response.ok) {
            const data = await response.json();
            const caption = Array.isArray(data) && data[0] && data[0].generated_text ? data[0].generated_text : "";

            if (caption) {
                return parseVisionCaption(caption, fileSizeKB);
            }
        }
    } catch (err) {
        console.warn("HuggingFace Vision API call failed:", err.message);
    }

    // Honest Fallback: Return clear "image analysis unavailable" result
    return createUnavailableResult("Real vision API service currently unavailable");
}

function mapPredictionsToCivicResults(predictions, fileSizeKB) {
    const topPred = predictions[0];
    const className = topPred.className || "object";
    // Actual model probability without artificial inflation
    const actualConfidence = Math.max(0, Math.min(1.0, Math.round(topPred.probability * 100) / 100));
    const detectedObjects = predictions.map(p => p.className.split(",")[0].trim());

    let tag = "Civic Infrastructure Defect";
    let category = "urban-infrastructure";

    const text = className.toLowerCase();
    if (text.includes("hole") || text.includes("road") || text.includes("pavement") || text.includes("manhole") || text.includes("trench") || text.includes("asphalt")) {
        tag = "Road Surface Pothole & Fracture";
        category = "urban-infrastructure";
    } else if (text.includes("water") || text.includes("drain") || text.includes("dam") || text.includes("pier") || text.includes("fountain")) {
        tag = "Water Logging & Pipeline Leakage";
        category = "water";
    } else if (text.includes("garbage") || text.includes("trash") || text.includes("cart") || text.includes("waste")) {
        tag = "Solid Waste & Overflowing Garbage Dump";
        category = "sanitation";
    } else if (text.includes("light") || text.includes("lamp") || text.includes("wire") || text.includes("pole") || text.includes("electric")) {
        tag = "Hazardous Electrical Wiring & Light Failure";
        category = "public-service";
    }

    return [
        {
            tag,
            confidence: actualConfidence, // True model probability
            confidenceType: "model",
            category,
            description: `Open-Source MobileNet Neural Model detected "${className}" (${Math.round(actualConfidence * 100)}% model probability).`,
            detectedObjects
        }
    ];
}

function createUnavailableResult(reason) {
    return [
        {
            tag: "Image Analysis Unavailable",
            confidence: null,
            heuristicConfidence: null,
            confidenceType: "unavailable",
            category: "urban-infrastructure",
            description: `Image analysis unavailable: ${reason}`,
            detectedObjects: []
        }
    ];
}

function parseVisionCaption(captionText, fileSizeKB) {
    const text = captionText.toLowerCase();

    let tag = "Civic Infrastructure Defect";
    let category = "urban-infrastructure";
    let candidateKeywords = ["infrastructure", "defect area"];

    if (text.includes("pothole") || text.includes("hole") || text.includes("road") || text.includes("asphalt") || text.includes("street") || text.includes("pavement") || text.includes("ground") || text.includes("crack")) {
        tag = "Road Surface Pothole & Fracture";
        category = "urban-infrastructure";
        candidateKeywords = ["road", "asphalt", "hole", "pavement", "crack", "street"];
    } else if (text.includes("water") || text.includes("puddle") || text.includes("flood") || text.includes("drain") || text.includes("stream") || text.includes("sewage")) {
        tag = "Water Logging & Pipeline Leakage";
        category = "water";
        candidateKeywords = ["water pool", "drainage", "puddle", "overflow", "water", "flood"];
    } else if (text.includes("garbage") || text.includes("trash") || text.includes("dump") || text.includes("waste") || text.includes("rubbish") || text.includes("litter")) {
        tag = "Solid Waste & Overflowing Garbage Dump";
        category = "sanitation";
        candidateKeywords = ["garbage dump", "trash container", "waste debris", "trash", "waste"];
    } else if (text.includes("wire") || text.includes("light") || text.includes("lamp") || text.includes("pole") || text.includes("electric")) {
        tag = "Hazardous Electrical Wiring & Light Failure";
        category = "public-service";
        candidateKeywords = ["electric pole", "exposed wire", "street lamp", "light", "wire"];
    }

    const matchedKeywords = candidateKeywords.filter(kw => text.includes(kw.toLowerCase()));
    const detectedObjects = matchedKeywords.length > 0 ? matchedKeywords : candidateKeywords.slice(0, 2);
    // Calculated heuristic confidence based on proportion of matched domain keywords
    const heuristicConfidence = Math.round((Math.min(1.0, (matchedKeywords.length / Math.max(1, candidateKeywords.length)) * 1.5)) * 100) / 100;

    return [
        {
            tag,
            confidence: null, // Caption model generates text, not class probabilities
            heuristicConfidence, // Clearly labeled heuristic confidence derived from keyword matches
            confidenceType: "heuristic",
            category,
            description: `Real Vision AI Model analyzed image content (${fileSizeKB}KB). Generated visual caption: "${captionText}".`,
            detectedObjects
        }
    ];
}

module.exports = {
    analyzeImage
};

