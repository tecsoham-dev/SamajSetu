/**
 * SamajSetu - Non-Destructive Seed Data Inserter for MongoDB Atlas database: `test`
 * 
 * Target: Cluster SamajSetu -> database `test`
 * Target Collections: `universities`, `industries`, `authorities`
 * Mode: Additional documents insertion ONLY (No deletes, drops, or updates)
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas URI targeting database `test`
const MONGO_TEST_URI = 'mongodb+srv://cs26surajmahato_db_user:surajmahatocs26@samajsetu.dma0tt4.mongodb.net/test?retryWrites=true&w=majority';

// 1. Schemas
const universitySchema = new mongoose.Schema(
  {
    name: String,
    code: String,
    location: String,
    departments: [String],
    expertise: [String],
    researchAreas: [String],
    nodalOfficer: { name: String, email: String, phone: String, designation: String },
    verificationStatus: { type: String, default: 'Verified' },
    activeProjectsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const industrySchema = new mongoose.Schema(
  {
    companyName: String,
    registrationNo: String,
    sector: [String],
    headquarters: String,
    supportOffered: [String],
    csrBudget: String,
    contactPerson: { name: String, email: String, phone: String, designation: String },
    verificationStatus: { type: String, default: 'Verified' }
  },
  { timestamps: true }
);

const authoritySchema = new mongoose.Schema(
  {
    departmentName: String,
    jurisdiction: String,
    authorityType: String,
    officialInCharge: { name: String, email: String, phone: String, designation: String },
    assignedCategories: [String]
  },
  { timestamps: true }
);

const University = mongoose.model('University', universitySchema, 'universities');
const Industry = mongoose.model('Industry', industrySchema, 'industries');
const Authority = mongoose.model('Authority', authoritySchema, 'authorities');

// 2. Seed Records
const seedUniversities = [
  {
    name: "Jadavpur University",
    code: "UNI-JU-01",
    location: "Kolkata, West Bengal",
    departments: ["Civil Engineering", "Water Resources Engineering", "Computer Science"],
    expertise: ["GIS Mapping", "Flood Management", "Hydraulics & Piping", "Urban Infrastructure"],
    researchAreas: ["Smart Drainage Networks", "Urban Flood Risk Mitigation"],
    nodalOfficer: { name: "Dr. A. Banerjee", email: "rnd@jadavpur.edu", phone: "+91 9830012345", designation: "Dean of R&D" },
    verificationStatus: "Verified",
    activeProjectsCount: 3
  },
  {
    name: "IIT Kharagpur",
    code: "UNI-IITKGP-02",
    location: "Kharagpur, West Bengal",
    departments: ["School of Environmental Science", "Electrical Engineering", "Civil Engineering"],
    expertise: ["IoT Sensors", "Water Quality Testing", "Waste Management & Recycling", "Smart Grid"],
    researchAreas: ["IoT Pollution Sensors", "Clean Environment Tech", "Renewable Energy"],
    nodalOfficer: { name: "Prof. R. Sengupta", email: "research@iitkgp.ac.in", phone: "+91 9434056789", designation: "Nodal Officer" },
    verificationStatus: "Verified",
    activeProjectsCount: 5
  },
  {
    name: "Anna University",
    code: "UNI-AU-03",
    location: "Chennai, Tamil Nadu",
    departments: ["Centre for Water Resources", "Remote Sensing & GIS", "Information Technology"],
    expertise: ["Remote Sensing", "Coastal Water Management", "GIS Mapping", "AI Analytics"],
    researchAreas: ["Coastal Drainage Systems", "Urban Heat Mapping"],
    nodalOfficer: { name: "Dr. K. Ramanathan", email: "cwr@annauniv.edu", phone: "+91 9444012345", designation: "Head of R&D" },
    verificationStatus: "Verified",
    activeProjectsCount: 2
  },
  {
    name: "VJTI Mumbai",
    code: "UNI-VJTI-04",
    location: "Mumbai, Maharashtra",
    departments: ["Structural Engineering", "Environmental Engineering"],
    expertise: ["Structural Audit", "Road Pavement Hazard", "Solid Waste Management"],
    researchAreas: ["High-Durability Road Pavements", "Smart Waste Bins"],
    nodalOfficer: { name: "Prof. S. Kulkarni", email: "innovation@vjti.ac.in", phone: "+91 9820098765", designation: "R&D Coordinator" },
    verificationStatus: "Verified",
    activeProjectsCount: 4
  },
  {
    name: "Delhi Technological University (DTU)",
    code: "UNI-DTU-05",
    location: "New Delhi, Delhi",
    departments: ["Civil & Environmental Engineering", "Computer Science"],
    expertise: ["AI Surveillance", "Smart Illumination", "Air Quality Monitoring", "Urban Infrastructure"],
    researchAreas: ["AQI Prediction Models", "Smart Streetlight Grid"],
    nodalOfficer: { name: "Dr. V. Sharma", email: "rnd@dtu.ac.in", phone: "+91 9811054321", designation: "Dean of Research" },
    verificationStatus: "Verified",
    activeProjectsCount: 1
  }
];

const seedIndustries = [
  {
    companyName: "Tata Steel CSR Foundation",
    registrationNo: "IND-CSR-8812",
    sector: ["Civil Infrastructure", "Water Supply", "Clean Tech"],
    headquarters: "Kolkata, West Bengal",
    supportOffered: ["Funding / CSR Grant", "Mentorship"],
    csrBudget: "₹25,00,000",
    contactPerson: { name: "S. Mukherjee", email: "csr@tatasteel.com", phone: "+91 9831122334", designation: "CSR Lead" },
    verificationStatus: "Verified"
  },
  {
    companyName: "Wipro Environmental Solutions",
    registrationNo: "IND-TECH-4410",
    sector: ["Technology", "Sanitation", "Waste Management"],
    headquarters: "Bengaluru, Karnataka",
    supportOffered: ["Technology Stack", "Prototyping Lab"],
    csrBudget: "₹15,00,000",
    contactPerson: { name: "P. Nair", email: "impact@wipro.com", phone: "+91 9900011223", designation: "Director of Innovation" },
    verificationStatus: "Verified"
  },
  {
    companyName: "L&T Infrastructure CSR",
    registrationNo: "IND-INFRA-9901",
    sector: ["Civil Infrastructure", "Urban Transport"],
    headquarters: "Mumbai, Maharashtra",
    supportOffered: ["Equipment", "Prototyping Lab", "Mentorship"],
    csrBudget: "₹50,00,000",
    contactPerson: { name: "R. Deshmukh", email: "csr.infra@larsentoubro.com", phone: "+91 9821033445", designation: "Chief CSR Officer" },
    verificationStatus: "Verified"
  },
  {
    companyName: "Reliance Foundation CleanTech",
    registrationNo: "IND-CLEAN-5521",
    sector: ["Clean Tech", "Environment", "Water Supply"],
    headquarters: "Mumbai, Maharashtra",
    supportOffered: ["Funding / CSR Grant", "Equipment"],
    csrBudget: "₹35,00,000",
    contactPerson: { name: "A. Mehta", email: "cleantech@foundation.reliance.com", phone: "+91 9820055667", designation: "Head of Grants" },
    verificationStatus: "Verified"
  }
];

const seedAuthorities = [
  {
    departmentName: "Public Works Department (PWD)",
    jurisdiction: "Kolkata Metropolitan Region",
    authorityType: "State Govt Department",
    officialInCharge: { name: "Er. K. Chakraborty", email: "pwd.kolkata@wb.gov.in", phone: "+91 33 2214 0000", designation: "Superintending Engineer" },
    assignedCategories: ["Infrastructure", "Public Transport"]
  },
  {
    departmentName: "Water Supply & Sewerage Board",
    jurisdiction: "Ward 1 to 144 Kolkata",
    authorityType: "Municipal Body",
    officialInCharge: { name: "Er. M. Roy", email: "waterboard@kmcgov.in", phone: "+91 33 2286 1000", designation: "Chief Hydraulic Engineer" },
    assignedCategories: ["Water Supply", "Sanitation", "Environment"]
  },
  {
    departmentName: "Solid Waste Management Board",
    jurisdiction: "Municipal Ward 1 to 144",
    authorityType: "Municipal Body",
    officialInCharge: { name: "Dr. S. Das", email: "swm@kmcgov.in", phone: "+91 33 2286 2000", designation: "Chief Health & Sanitation Officer" },
    assignedCategories: ["Sanitation", "Environment"]
  },
  {
    departmentName: "Electricity Distribution Board",
    jurisdiction: "Metropolitan Area",
    authorityType: "State Govt Department",
    officialInCharge: { name: "Er. V. Agarwal", email: "electricity.board@state.gov.in", phone: "+91 33 2214 9999", designation: "Chief Electrical Engineer" },
    assignedCategories: ["Electricity", "Security"]
  }
];

// 3. Execution Function
async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas database: `test`...');
    await mongoose.connect(MONGO_TEST_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB Atlas target database: `test`\n');

    // Insert Universities (Non-destructive check: insert documents)
    const insertedUnis = await University.insertMany(seedUniversities);
    console.log(`📥 Inserted ${insertedUnis.length} new records into 'universities' collection.`);

    // Insert Industries
    const insertedInds = await Industry.insertMany(seedIndustries);
    console.log(`📥 Inserted ${insertedInds.length} new records into 'industries' collection.`);

    // Insert Authorities
    const insertedAuths = await Authority.insertMany(seedAuthorities);
    console.log(`📥 Inserted ${insertedAuths.length} new records into 'authorities' collection.`);

    // Document Counts Summary
    const uniCount = await University.countDocuments();
    const indCount = await Industry.countDocuments();
    const authCount = await Authority.countDocuments();

    console.log('\n=================================================');
    console.log('📊 RESULTING DOCUMENT COUNTS IN DATABASE `test`:');
    console.log(`  • Collection 'universities': ${uniCount} total documents`);
    console.log(`  • Collection 'industries':   ${indCount} total documents`);
    console.log(`  • Collection 'authorities':  ${authCount} total documents`);
    console.log('=================================================\n');

    await mongoose.disconnect();
    console.log('🔒 Disconnected safely from MongoDB Atlas database `test`. Insertion Complete!');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
}

seedDatabase();
