// Import dependencies
require('dotenv').config(); // MUST be at the top
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
// const fs = require("fs"); // No longer needed for local uploads

// --- ADD CLOUDINARY ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Initialize app
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Configuration ---
const MONGO_URI = process.env.MONGO_URI; // Loads from .env
const JWT_SECRET = process.env.JWT_SECRET; // Loads from .env
const PORT = process.env.PORT || 3030; // Use Render's port or 3030 locally

// --- REMOVED Local File Serving ---
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)){
//     fs.mkdirSync(uploadDir);
// }
// app.use('/uploads', express.static(uploadDir)); // <-- REMOVED

// -------------------- Cloudinary Configuration --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for Vehicle/User IMAGES and PDFs
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'readygo-images', // A folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf']
  }
});

// Storage for Booking VIDEOS
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'readygo-videos', // A folder name for videos
    resource_type: 'video', // Tell Cloudinary these are videos
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv']
  }
});

// --- REPLACED Multer Config ---
// Multer parser for user document IMAGES/PDFs
const uploadUserDocs = multer({
    storage: imageStorage,
    fileFilter: (req, file, cb) => { // You can still filter
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and PDFs allowed.'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Multer parser for single vehicle IMAGE
const uploadVehicleImage = multer({
    storage: imageStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images allowed.'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Multer parser for booking VIDEOS
const uploadBookingVideo = multer({
    storage: videoStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only videos allowed.'), false);
        }
    },
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});
// --- END OF NEW MULTER/CLOUDINARY CONFIG ---


// -------------------- MongoDB Connection --------------------
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit if DB connection fails
  }
}

connectToDatabase();

// -------------------- Schemas & Models --------------------

// --- User Schema ---
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Store hashed passwords in production!
  role: { type: String, enum: ['Customer', 'Owner', 'Admin'], required: true },
  phone: { type: String, default: '', trim: true },
  licenseStatus: { type: String, enum: ['Not Uploaded', 'Pending Review', 'Verified', 'Rejected'], default: 'Not Uploaded' },
  licenseNumber: { type: String, default: '', trim: true },
  licenseFile: { type: String }, // Stores the Cloudinary URL
  addressStatus: { type: String, enum: ['Not Uploaded', 'Pending Review', 'Verified', 'Rejected'], default: 'Not Uploaded' },
  aadhaarNumber: { type: String, default: '', trim: true },
  addressFile: { type: String }, // Stores the Cloudinary URL
  isLocked: { type: Boolean, default: false },
  lockExpiresAt: { type: Date, default: null },
}, { timestamps: true });
const UserModel = mongoose.model("User", userSchema);

// --- Vehicle Schema ---
const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Bike', 'Scooter', 'Car'], required: true },
  plate: { type: String, required: true, unique: true, trim: true, uppercase: true },
  pricePerDay: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' }, // Stores the Cloudinary URL
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });
const VehicleModel = mongoose.model("Vehicle", vehicleSchema);

// --- Booking Schema ---
const bookingSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Upcoming'], default: 'Pending' },
    feedbackGiven: { type: Boolean, default: false }, // To track if customer left feedback
    preRideVideo: { type: String }, // Stores the Cloudinary URL
}, { timestamps: true });
bookingSchema.pre('save', function(next) {
    if (this.endDate < this.startDate) {
        next(new Error('End date must be on or after start date.'));
    } else {
        next();
    }
});
const BookingModel = mongoose.model("Booking", bookingSchema);

// --- Notification Schema ---
const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String } // Optional link for the notification
}, { timestamps: true });
const NotificationModel = mongoose.model("Notification", notificationSchema);

// --- Complaint Schema ---
const complaintSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
    replies: [{
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Could be admin or support staff
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });
const ComplaintModel = mongoose.model("Complaint", complaintSchema);

// --- Review Schema ---
const reviewSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // Link review to a booking
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }, // Or directly to a vehicle
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User giving the review
    revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Owner/Customer being reviewed (optional)
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
    reviewType: { type: String, enum: ['Vehicle', 'Owner', 'Customer', 'Platform'], required: true }
}, { timestamps: true });
const ReviewModel = mongoose.model("Review", reviewSchema);

// --- Damage Report Schema ---
const damageReportSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    description: { type: String, required: true },
    preRideVideo: { type: String }, // Path copied from booking (Cloudinary URL)
    damageVideo: { type: String, required: true }, // Path to new damage video (Cloudinary URL)
    status: { type: String, enum: ['Pending Review', 'Resolved'], default: 'Pending Review' },
    replies: [{ // Admin replies to this report
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });
const DamageReportModel = mongoose.model("DamageReport", damageReportSchema);


// --- Settings Schema ---
const settingsSchema = new mongoose.Schema({
    key: { type: String, default: 'platformSettings', unique: true }, // Singleton pattern
    platformFeePercent: { type: Number, default: 5.0, min: 0, max: 100 }
});
const SettingsModel = mongoose.model("Setting", settingsSchema);

// Ensure settings document exists on startup
SettingsModel.findOneAndUpdate(
    { key: 'platformSettings' },
    { $setOnInsert: { platformFeePercent: 5.0 } }, // Set default only if inserting
    { upsert: true, new: true } // Create if not exist, return new doc
).then(() => console.log("Platform settings initialized.")).catch(err => console.error("Error initializing settings:", err));

// --- Chat Schema ---
const chatSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true }, // Denormalized for easier display
    receiverName: { type: String, required: true }, // Denormalized for easier display
    message: { type: String, required: true, trim: true },
}, { timestamps: true });
const ChatModel = mongoose.model("Chat", chatSchema);

// -------------------- Middleware --------------------

// Verify JWT Token
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or token is invalid" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adds { id, role } to req object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error("❌ Token Verification Error:", err.message);
    if (err.name === 'JsonWebTokenError') {
         return res.status(401).json({ message: "Invalid token" });
    }
    if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ message: "Token expired" });
    }
    // For other errors during verification
    return res.status(403).json({ message: "Failed to authenticate token" });
  }
}

// Verify Admin Role (runs *after* verifyToken)
function verifyAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next(); // Proceed if user is an Admin
}

// Verify Owner Role (runs *after* verifyToken)
function verifyOwner(req, res, next) {
    if (!req.user || req.user.role !== 'Owner') {
        return res.status(403).json({ message: 'Access denied. Owner role required.' });
    }
    next(); // Proceed if user is an Owner
}


// -------------------- Authentication Routes --------------------

// User Registration
app.post("/register", async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        // Basic validation
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ message: "All fields (fullName, email, password, role) are required" });
        }
        if (!['Customer', 'Owner'].includes(role)) { // Only allow Customer or Owner registration
            return res.status(400).json({ message: "Invalid role specified. Must be 'Customer' or 'Owner'." });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // IMPORTANT: Hash password in a real app! Use libraries like bcrypt
        // const hashedPassword = await bcrypt.hash(password, 10); // Example using bcrypt
        const newUser = await UserModel.create({
             fullName,
             email,
             password, // Store hashedPassword in production
             role
        });

        res.status(201).json({ message: "User registered successfully", userId: newUser._id });
    } catch (err) {
        console.error("❌ Registration Error:", err);
        if (err.name === 'ValidationError') {
             return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Server error during registration" });
    }
});

// User Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // IMPORTANT: Compare hashed password in a real app! Use bcrypt.compare
        // const isMatch = await bcrypt.compare(password, user.password);
        // if (!isMatch) { return res.status(401).json({ message: "Invalid credentials" }); }
        if (user.password !== password) { // Replace with hash comparison
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if account is locked
        if (user.isLocked) {
            if (user.lockExpiresAt && user.lockExpiresAt > new Date()) {
                // Account is still locked
                return res.status(403).json({ message: `Account is locked. Please try again after ${user.lockExpiresAt.toLocaleString()}` });
            } else {
                // Lock expired, unlock the account before proceeding
                user.isLocked = false;
                user.lockExpiresAt = null;
                await user.save();
            }
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Payload: include user ID and role
            JWT_SECRET,
            { expiresIn: "24h" } // Token expiry time
        );

        // Send token and user info (excluding password)
        res.json({
            message: "Login successful",
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error("❌ Login Error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- ADDED: NEW ROUTE FOR ADMIN REGISTRATION ---
app.post("/admin/register", async (req, res) => {
    try {
        const { fullName, email, password, secretKey } = req.body;

        // 1. Get the secret from environment
        const SERVER_SECRET = process.env.ADMIN_REGISTER; // Using your new .env variable

        // 2. Validate the secret key
        if (!SERVER_SECRET) {
            // This is a server configuration error
            console.error("ADMIN_REGISTER secret key is not set in .env file.");
            return res.status(500).json({ message: "Server configuration error. Cannot process admin registration." });
        }
        if (!secretKey || secretKey !== SERVER_SECRET) {
            return res.status(401).json({ message: "Invalid Secret Key. Admin registration denied." });
        }
        
        // 3. Standard user validation
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Full Name, Email, and Password are required." });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // 4. Create the new Admin user
        // (Remember to hash password in production)
        const newUser = await UserModel.create({
            fullName,
            email,
            password, // Should be hashedPassword in a real app
            role: 'Admin', // <-- The key difference
            // Set documents as 'Verified' for admins by default
            licenseStatus: 'Verified',
            addressStatus: 'Verified'
        });

        res.status(201).json({ message: "Admin registered successfully. You can now log in.", userId: newUser._id });

    } catch (err) {
        console.error("❌ Admin Registration Error:", err);
        if (err.name === 'ValidationError') {
             return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Server error during admin registration" });
    }
});
// --- END OF NEW ROUTE ---


// -------------------- Vehicle Routes --------------------

// Get Publicly Available Vehicles (No Auth required)
app.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await VehicleModel.find({ isAvailable: true }).populate('ownerId', 'fullName'); // Populate owner name
        res.status(200).json(vehicles);
    } catch (error) {
        console.error("❌ Get Vehicles Error:", error);
        res.status(500).json({ message: 'Error fetching vehicles' });
    }
});


// -------------------- Booking Routes --------------------

// Create a new Booking (Customer only)
app.post('/bookings', verifyToken, async (req, res) => {
    // Only Customers can create bookings
    if (!req.user || req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Only customers can make bookings.' });
    }
    try {
        const { vehicleId, ownerId, startDate, endDate, totalPrice } = req.body;
         if (!vehicleId || !ownerId || !startDate || !endDate || totalPrice === undefined) {
             return res.status(400).json({ message: 'Missing required booking information: vehicleId, ownerId, startDate, endDate, totalPrice.' });
         }

        const customerId = req.user.id; // Get customer ID from verified token

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
            return res.status(400).json({ message: "Invalid start or end date." });
        }

        // Check vehicle availability and owner match
        const vehicle = await VehicleModel.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found." });
        }
        if (!vehicle.isAvailable) {
            return res.status(400).json({ message: "Vehicle is not available for the selected dates." }); // Improve this check later for specific date ranges
        }
        if (vehicle.ownerId.toString() !== ownerId) {
             return res.status(400).json({ message: "Owner ID mismatch for the selected vehicle." });
        }

        // Calculate price on backend for security
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive days
        const calculatedPrice = diffDays * vehicle.pricePerDay;

        // Use backend calculated price
        const newBooking = await BookingModel.create({
            customerId, vehicleId, ownerId, startDate: start, endDate: end,
            totalPrice: calculatedPrice,
            status: 'Pending' // NEW: Status starts as Pending
        });

        // DO NOT mark vehicle as unavailable yet. Wait for owner confirmation.

        // Notify Owner
        await NotificationModel.create({
             userId: ownerId,
             message: `New booking request for ${vehicle.name} from ${new Date(startDate).toLocaleDateString()}.`,
             link: `/owner/orders` // Link to owner's orders page
        });

        res.status(201).json(newBooking);
    } catch (error) {
        console.error("❌ Create Booking Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error creating booking' });
    }
});

// Get Bookings for the logged-in Customer
app.get('/bookings/customer', verifyToken, async (req, res) => {
    if (!req.user || req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Access denied. Customers only.' });
    }
    try {
        const bookings = await BookingModel.find({ customerId: req.user.id })
            .populate('vehicleId', 'name imageUrl location') // Populate vehicle details
            .populate('ownerId', 'fullName') // Populate owner name for potential contact
            .sort({ startDate: -1 }); // Show most recent first
        res.status(200).json(bookings);
    } catch (error) {
        console.error("❌ Get Customer Bookings Error:", error);
        res.status(500).json({ message: 'Error fetching booking history' });
    }
});

// Get Dashboard Stats for the logged-in Customer
app.get('/bookings/stats', verifyToken, async (req, res) => {
   if (!req.user || req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Access denied. Customers only.' });
    }
    try {
        const customerId = req.user.id;
        const user = await UserModel.findById(customerId).select('licenseStatus addressStatus'); // Get user's verification status
        if (!user) {
             return res.status(404).json({ message: 'User not found.' });
        }

        // Count upcoming and completed bookings
        const upcoming = await BookingModel.countDocuments({ customerId, status: { $in: ['Upcoming', 'Confirmed'] } }); // Include Confirmed as upcoming
        const completed = await BookingModel.countDocuments({ customerId, status: 'Completed' });

        // Determine overall verification status
        let verificationStatus = 'Not Uploaded';
        if (user.licenseStatus === 'Verified' && user.addressStatus === 'Verified') {
            verificationStatus = 'Verified';
        } else if (user.licenseStatus === 'Pending Review' || user.addressStatus === 'Pending Review') {
            verificationStatus = 'Pending';
        } else if (user.licenseStatus === 'Rejected' || user.addressStatus === 'Rejected') {
            verificationStatus = 'Rejected';
        } // else remains 'Not Uploaded'

        res.status(200).json({ upcoming, completed, verificationStatus });
    } catch (error) {
        console.error("❌ Get Booking Stats Error:", error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});


// -------------------- Notification Routes --------------------

// Get notifications for the logged-in user (Customer)
app.get('/notifications/customer', verifyToken, async (req, res) => {
    if (!req.user || req.user.role !== 'Customer') {
       return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        const notifications = await NotificationModel.find({ userId: req.user.id })
            .sort({ createdAt: -1 }); // Most recent first
        res.status(200).json(notifications);
    } catch (error) {
        console.error(`❌ Get Customer Notifications Error:`, error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Get unread notification count for the logged-in user (Customer)
app.get('/notifications/customer/unread-count', verifyToken, async (req, res) => {
    if (!req.user || req.user.role !== 'Customer') {
       return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        const count = await NotificationModel.countDocuments({ userId: req.user.id, isRead: false });
        res.status(200).json({ count });
    } catch (error) {
        console.error(`❌ Get Unread Customer Count Error:`, error);
        res.status(500).json({ message: 'Error fetching unread notification count' });
    }
});

// Mark notifications as read for the logged-in user (Customer)
app.put('/notifications/customer/mark-read', verifyToken, async (req, res) => {
    if (!req.user || req.user.role !== 'Customer') {
       return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        await NotificationModel.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: 'Notifications marked as read.' });
    } catch (error) {
        console.error(`❌ Mark Customer Read Error:`, error);
        res.status(500).json({ message: 'Error marking notifications as read' });
    }
});

// --- NEW/FIXED: Delete single notification for customer ---
app.delete('/notifications/customer/:id', verifyToken, async (req, res) => {
    // Check for customer role (or just check if userId matches)
    if (req.user.role !== 'Customer') {
         return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: 'Invalid notification ID.' });
        }
        
        const result = await NotificationModel.findOneAndDelete({ _id: notificationId, userId: userId });

        if (!result) {
            return res.status(404).json({ message: 'Notification not found or you do not have permission.' });
        }

        res.status(200).json({ message: 'Notification deleted.' });
    } catch (error) {
        console.error("❌ Delete Customer Notification Error:", error);
        res.status(500).json({ message: 'Error deleting notification.' });
    }
});

// --- NEW/FIXED: Delete all notifications for customer ---
app.delete('/notifications/customer/all', verifyToken, async (req, res) => {
    if (req.user.role !== 'Customer') {
         return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        const userId = req.user.id;
        await NotificationModel.deleteMany({ userId: userId });
        res.status(200).json({ message: 'All notifications cleared.' });
    } catch (error) {
        console.error("❌ Clear All Customer Notifications Error:", error);
        res.status(500).json({ message: 'Error clearing notifications.' });
    }
});


// Get notifications for owner
app.get('/notifications/owner', verifyToken, verifyOwner, async (req, res) => {
    try {
        const ownerId = req.user.id;
        const notifications = await NotificationModel.find({ userId: ownerId })
            .sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("❌ Get Owner Notifications Error:", error);
        res.status(500).json({ message: 'Error fetching owner notifications' });
    }
});

// --- NEW: Delete single notification for owner ---
app.delete('/notifications/owner/:id', verifyToken, verifyOwner, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const ownerId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: 'Invalid notification ID.' });
        }

        const result = await NotificationModel.findOneAndDelete({ _id: notificationId, userId: ownerId });

        if (!result) {
            return res.status(404).json({ message: 'Notification not found or you do not have permission to delete it.' });
        }

        res.status(200).json({ message: 'Notification deleted successfully.' });
    } catch (error) {
        console.error("❌ Delete Owner Notification Error:", error);
        res.status(500).json({ message: 'Error deleting notification.' });
    }
});

// --- NEW: Delete all notifications for owner ---
app.delete('/notifications/owner/all', verifyToken, verifyOwner, async (req, res) => {
    try {
        const ownerId = req.user.id;
        await NotificationModel.deleteMany({ userId: ownerId });
        res.status(200).json({ message: 'All notifications cleared successfully.' });
    } catch (error) {
        console.error("❌ Clear All Owner Notifications Error:", error);
        res.status(500).json({ message: 'Error clearing notifications.' });
    }
});


// -------------------- Profile Routes --------------------

// Get Customer Profile
app.get('/profile/customer', verifyToken, async (req, res) => {
    if (!req.user || req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Access denied. Customers only.' });
    }
    try {
        const user = await UserModel.findById(req.user.id).select('-password'); // Exclude password
        if (!user) return res.status(404).json({ message: "User not found." });
        res.status(200).json(user);
    } catch (error) {
        console.error("❌ Get Customer Profile Error:", error);
         res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update Customer Profile
app.put('/profile/customer', verifyToken, async (req, res) => {
   if (!req.user || req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Access denied. Customers only.' });
    }
    try {
        const { fullName, phone } = req.body;
        // Basic validation for fullName
        if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length === 0)) {
             return res.status(400).json({ message: 'Full name cannot be empty.' });
        }
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName.trim();
        if (phone !== undefined) updateData.phone = phone || ''; // Allow empty phone

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user.id,
            { $set: updateData }, // Use $set to only update provided fields
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from response

        if (!updatedUser) {
             return res.status(404).json({ message: 'User not found during update.' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("❌ Update Customer Profile Error:", error);
         res.status(500).json({ message: 'Error updating profile' });
    }
});

// Customer Password Change
app.put('/profile/customer/password', verifyToken, async (req, res) => {
    // This route can be used by any authenticated user for their own password
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required.' });
        }
         if (newPassword.length < 6) { // Basic password length validation
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // IMPORTANT: Replace with hash comparison in production
        // const isMatch = await bcrypt.compare(currentPassword, user.password);
        // if (!isMatch) { return res.status(401).json({ message: 'Invalid current password.' }); }
        if (user.password !== currentPassword) {
            return res.status(401).json({ message: 'Invalid current password.' });
        }


        // IMPORTANT: Hash newPassword before saving
        // const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = newPassword; // Replace with hashedNewPassword
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error(`❌ ${req.user.role} Password Change Error:`, error);
        res.status(500).json({ message: 'Error updating password.' });
    }
});


// Owner Profile Routes (Similar to customer)
app.get('/profile/owner', verifyToken, verifyOwner, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "Owner profile not found." });
        res.status(200).json(user);
    } catch (error) {
        console.error("❌ Get Owner Profile Error:", error);
        res.status(500).json({ message: 'Error fetching owner profile' });
    }
});
app.put('/profile/owner', verifyToken, verifyOwner, async (req, res) => {
    try {
        const { fullName, phone } = req.body;
        if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length === 0)) {
             return res.status(400).json({ message: 'Full name cannot be empty.' });
        }
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName.trim();
        if (phone !== undefined) updateData.phone = phone || '';

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'Owner not found during update.' });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("❌ Update Owner Profile Error:", error);
        res.status(500).json({ message: 'Error updating owner profile' });
    }
});

// Owner Password Change (can reuse the customer endpoint logic or keep separate)
app.put('/owner/password', verifyToken, verifyOwner, async (req, res) => {
    // Re-implementing similar logic as customer password change
     try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required.' });
        }
         if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Replace with hash comparison
        if (user.password !== currentPassword) {
            return res.status(401).json({ message: 'Invalid current password.' });
        }

        // Hash new password
        user.password = newPassword; // Replace with hashed password
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error(`❌ Owner Password Change Error:`, error);
        res.status(500).json({ message: 'Error updating password.' });
    }
});


// -------------------- Document Routes --------------------

// Get Document Status for logged-in user (Customer or Owner)
app.get('/documents/status', verifyToken, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    try {
        const user = await UserModel.findById(req.user.id).select('licenseStatus addressStatus licenseNumber aadhaarNumber');
        if (!user) return res.status(404).json({ message: "User not found." });
        res.status(200).json({
            licenseStatus: user.licenseStatus,
            addressStatus: user.addressStatus,
            licenseNumber: user.licenseNumber,
            aadhaarNumber: user.aadhaarNumber
        });
    } catch (error) {
        console.error("❌ Get Doc Status Error:", error);
        res.status(500).json({ message: 'Error fetching document status' });
    }
});

// MODIFIED: Upload Documents (Customer or Owner)
// --- USING CLOUDINARY'S 'uploadUserDocs' MIDDLEWARE ---
app.post('/documents/upload', verifyToken, uploadUserDocs.fields([{ name: 'license', maxCount: 1 }, { name: 'address', maxCount: 1 }]), async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        const { licenseNumber, aadhaarNumber } = req.body;

        let update = {};
        let needsSave = false;

        // Process License
        if (req.files['license']) {
            if (!licenseNumber || licenseNumber.trim() === '') {
                 // Clean up uploaded file from Cloudinary
                 await cloudinary.uploader.destroy(req.files['license'][0].filename);
                 return res.status(400).json({ message: 'License number is required with file upload.' });
            }
             // Delete old file from Cloudinary if it exists
            if (user.licenseFile && (user.licenseFile.includes('cloudinary') || user.licenseFile.startsWith('readygo-images/'))) {
                 const publicId = path.parse(user.licenseFile).name; // Get public_id from URL/path
                 try { await cloudinary.uploader.destroy(`readygo-images/${publicId}`); } catch (e) { console.error("Cloudinary delete old license error", e)}
            }
            update.licenseFile = req.files['license'][0].path; // This is now a Cloudinary URL
            update.licenseStatus = 'Pending Review';
            update.licenseNumber = licenseNumber.trim();
            needsSave = true;
        } else if (licenseNumber && licenseNumber.trim() !== user.licenseNumber) {
             update.licenseNumber = licenseNumber.trim();
             // If number changes, and not verified, set to pending
             if (user.licenseStatus !== 'Verified') update.licenseStatus = 'Pending Review';
             needsSave = true;
        }

        // Process Address
        if (req.files['address']) {
             if (!aadhaarNumber || aadhaarNumber.trim() === '') {
                 // Clean up uploaded file from Cloudinary
                 await cloudinary.uploader.destroy(req.files['address'][0].filename);
                 return res.status(400).json({ message: 'Aadhaar number is required with file upload.' });
            }
            // Delete old file from Cloudinary if it exists
            if (user.addressFile && (user.addressFile.includes('cloudinary') || user.addressFile.startsWith('readygo-images/'))) {
                const publicId = path.parse(user.addressFile).name;
                try { await cloudinary.uploader.destroy(`readygo-images/${publicId}`); } catch (e) { console.error("Cloudinary delete old address error", e)}
            }
            update.addressFile = req.files['address'][0].path; // This is now a Cloudinary URL
            update.addressStatus = 'Pending Review';
            update.aadhaarNumber = aadhaarNumber.trim();
            needsSave = true;
        } else if (aadhaarNumber && aadhaarNumber.trim() !== user.aadhaarNumber) {
             update.aadhaarNumber = aadhaarNumber.trim();
             if (user.addressStatus !== 'Verified') update.addressStatus = 'Pending Review';
             needsSave = true;
        }


        if (needsSave) {
             Object.assign(user, update);
             await user.save();
        }

        res.status(200).json({
            message: needsSave ? "Documents submitted successfully. Pending review." : "No new documents submitted or numbers changed.",
            licenseStatus: user.licenseStatus,
            addressStatus: user.addressStatus
        });

    } catch (error) {
         console.error("❌ Doc Upload Error:", error);
         // Cleanup Cloudinary files if they exist on error
         if (req.files) {
             if (req.files['license']?.[0]) { try { await cloudinary.uploader.destroy(req.files['license'][0].filename); } catch(e){ console.error("Cleanup Error L:", e);} }
             if (req.files['address']?.[0]) { try { await cloudinary.uploader.destroy(req.files['address'][0].filename); } catch(e){ console.error("Cleanup Error A:", e);} }
         }
         if (error instanceof multer.MulterError) {
             return res.status(400).json({ message: `File upload error: ${error.message}` });
         }
         if (error.message.includes('Invalid file type')) {
              return res.status(400).json({ message: error.message });
         }
         if (error.name === 'ValidationError') {
             return res.status(400).json({ message: `Validation Error: ${error.message}` });
         }
         res.status(500).json({ message: 'Error processing document upload.' });
    }
});


// -------------------- Owner Routes (Specific Owner Actions) --------------------

// MODIFIED: Add Vehicle with Image Upload (Owner only)
// --- USING CLOUDINARY'S 'uploadVehicleImage' MIDDLEWARE ---
app.post('/owner/vehicles/addwithimage', verifyToken, verifyOwner, uploadVehicleImage.single('image'), async (req, res) => {
    try {
        const { name, type, plate, pricePerDay, location } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Vehicle image is required.' });
        }
        if (!name || !type || !plate || pricePerDay === undefined || !location) {
             // Clean up file if validation fails
             await cloudinary.uploader.destroy(req.file.filename);
             return res.status(400).json({ message: 'Missing required fields: Name, Type, Plate, Price, Location.' });
        }
        if (isNaN(pricePerDay) || Number(pricePerDay) < 0) {
            // Clean up file if validation fails
             await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({ message: 'Price per day must be a valid non-negative number.' });
        }

        const newVehicle = await VehicleModel.create({
            ownerId: req.user.id,
            name, type, plate,
            pricePerDay: Number(pricePerDay),
            location,
            imageUrl: req.file.path // This is now a Cloudinary URL
        });
        res.status(201).json(newVehicle);
    } catch (error) {
        console.error("❌ Add Vehicle w/ Image Error:", error);
         // Clean up uploaded file on error
         if (req.file) {
             try { await cloudinary.uploader.destroy(req.file.filename); } catch(e){ console.error("Cleanup Error Add Vehicle:", e);}
         }
        if (error.code === 11000 && error.keyPattern && error.keyPattern.plate) {
             return res.status(400).json({ message: 'Vehicle with this plate number already exists.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error adding vehicle' });
    }
});


// (Get Owner Stats route remains the same)
app.get('/owner/stats', verifyToken, verifyOwner, async (req, res) => {
    try {
        const ownerId = req.user.id;
        const totalVehicles = await VehicleModel.countDocuments({ ownerId });
        const activeBookings = await BookingModel.countDocuments({ ownerId, status: { $in: ['Upcoming', 'Confirmed'] } });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const completedBookingsThisMonth = await BookingModel.find({
             ownerId,
             status: 'Completed',
             endDate: { $gte: startOfMonth, $lte: endOfMonth }
        });
        const monthlyEarnings = completedBookingsThisMonth.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

        const ownerVehicleIds = await VehicleModel.find({ ownerId }).select('_id');
        const vehicleIds = ownerVehicleIds.map(v => v._id);

        const ratingAgg = await ReviewModel.aggregate([
            { $match: {
                $or: [
                     { vehicleId: { $in: vehicleIds }, reviewType: 'Vehicle' },
                     { revieweeId: new mongoose.Types.ObjectId(ownerId), reviewType: 'Owner' }
                ]
            }},
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        const overallRating = (ratingAgg[0]?.avgRating || 0);

        res.status(200).json({ totalVehicles, activeBookings, monthlyEarnings, overallRating });
    } catch (error) {
        console.error("❌ Get Owner Stats Error:", error);
        res.status(500).json({ message: 'Error fetching owner statistics' });
    }
});

// (Get Owner Vehicles route remains the same)
app.get('/owner/vehicles', verifyToken, verifyOwner, async (req, res) => {
    try {
        const ownerVehicles = await VehicleModel.find({ ownerId: req.user.id })
            .sort({ createdAt: -1 });
        res.status(200).json(ownerVehicles);
    } catch (error) {
        console.error("❌ Get Owner Vehicles Error:", error);
        res.status(500).json({ message: 'Error fetching owner vehicles' });
    }
});

// MODIFIED: Update a specific vehicle owned by the logged-in owner
// --- USING CLOUDINARY'S 'uploadVehicleImage' MIDDLEWARE ---
app.put('/owner/vehicles/:id', verifyToken, verifyOwner, uploadVehicleImage.single('image'), async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const ownerId = req.user.id;
        const { name, type, plate, pricePerDay, location, isAvailable } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (plate !== undefined) updateData.plate = plate;
        if (pricePerDay !== undefined) {
             if (isNaN(pricePerDay) || Number(pricePerDay) < 0) {
                 return res.status(400).json({ message: 'Price per day must be a valid non-negative number.' });
             }
             updateData.pricePerDay = Number(pricePerDay);
        }
        if (location !== undefined) updateData.location = location;
        if (isAvailable !== undefined) updateData.isAvailable = (isAvailable === 'true' || isAvailable === true);

        const vehicle = await VehicleModel.findOne({ _id: vehicleId, ownerId: ownerId });
        if (!vehicle) {
             if (req.file) { await cloudinary.uploader.destroy(req.file.filename); }
             return res.status(404).json({ message: 'Vehicle not found or you do not have permission to edit it.' });
        }

        // Handle new image upload
        if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (vehicle.imageUrl && (vehicle.imageUrl.includes('cloudinary') || vehicle.imageUrl.startsWith('readygo-images/'))) {
                const publicId = path.parse(vehicle.imageUrl).name;
                try { await cloudinary.uploader.destroy(`readygo-images/${publicId}`); } catch (e) { console.error("Cloudinary delete old vehicle image error:", e); }
            }
            updateData.imageUrl = req.file.path; // This is now a Cloudinary URL
        }

        if (Object.keys(updateData).length === 0 && !req.file) {
             return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        const updatedVehicle = await VehicleModel.findByIdAndUpdate(
            vehicleId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedVehicle);
    } catch (error) {
        console.error("❌ Update Vehicle Error:", error);
         if (req.file) {
             try { await cloudinary.uploader.destroy(req.file.filename); } catch(e){ console.error("Cleanup Error Edit Vehicle:", e);}
         }
         if (error.code === 11000 && error.keyPattern && error.keyPattern.plate) {
             return res.status(400).json({ message: 'Vehicle with this plate number already exists.' });
         }
         if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
         }
        res.status(500).json({ message: 'Error updating vehicle' });
    }
});


// (Get Owner Bookings route remains the same)
app.get('/owner/bookings', verifyToken, verifyOwner, async (req, res) => {
    try {
        const ownerId = req.user.id;
        const bookings = await BookingModel.find({ ownerId })
            .populate('customerId', 'fullName email phone')
            .populate('vehicleId', 'name plate')
            .sort({ startDate: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        console.error("❌ Get Owner Bookings Error:", error);
        res.status(500).json({ message: 'Error fetching owner bookings' });
    }
});

// MODIFIED: Confirm a PENDING booking request & store pre-ride video
// --- USING CLOUDINARY'S 'uploadBookingVideo' MIDDLEWARE ---
app.post('/owner/bookings/:id/confirm-with-video', verifyToken, verifyOwner, uploadBookingVideo.single('video'), async (req, res) => {
    try {
        const bookingId = req.params.id;
        const ownerId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Pre-ride video is required.' });
        }

        const booking = await BookingModel.findOne({ _id: bookingId, ownerId: ownerId, status: 'Pending' });

        if (!booking) {
             if (req.file) { await cloudinary.uploader.destroy(req.file.filename, { resource_type: "video" }); }
            return res.status(404).json({ message: 'Pending booking not found for this owner or already actioned.' });
        }

        booking.status = 'Confirmed';
        booking.preRideVideo = req.file.path; // This is now a Cloudinary URL
        const updatedBooking = await booking.save();

        await updatedBooking.populate(['customerId', 'vehicleId']);

        await VehicleModel.findByIdAndUpdate(updatedBooking.vehicleId._id, { isAvailable: false });

        await NotificationModel.create({
             userId: updatedBooking.customerId._id,
             message: `Your booking for ${updatedBooking.vehicleId.name} from ${new Date(updatedBooking.startDate).toLocaleDateString()} has been confirmed. You can view the pre-ride video.`,
             link: `/history`
        });

        res.status(200).json({ message: 'Booking confirmed with video.', booking: updatedBooking });
    } catch (error) {
        console.error("❌ Confirm Booking w/ Video Error:", error);
         if (req.file) {
            try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: "video" }); } catch(e){ console.error("Cleanup Error Confirm Video:", e);}
         }
         if (error instanceof multer.MulterError) {
             return res.status(400).json({ message: `Video upload error: ${error.message}` });
         }
         if (error.message.includes('Invalid file type')) {
              return res.status(400).json({ message: error.message });
         }
        res.status(500).json({ message: 'Error confirming booking with video' });
    }
});


// (Reject Booking route remains the same)
app.put('/owner/bookings/:id/reject', verifyToken, verifyOwner, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const ownerId = req.user.id;

        const updatedBooking = await BookingModel.findOneAndUpdate(
            { _id: bookingId, ownerId: ownerId, status: 'Pending' },
            { $set: { status: 'Cancelled' } },
            { new: true }
        ).populate('customerId', 'fullName').populate('vehicleId', 'name');

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Pending booking not found for this owner or already actioned.' });
        }

        await NotificationModel.create({
             userId: updatedBooking.customerId._id,
             message: `Unfortunately, your booking request for ${updatedBooking.vehicleId.name} from ${new Date(updatedBooking.startDate).toLocaleDateString()} was rejected by the owner.`,
             link: `/vehicle-search`
        });

        res.status(200).json({ message: 'Booking rejected.', booking: updatedBooking });
    } catch (error) {
        console.error("❌ Reject Booking Error:", error);
        res.status(500).json({ message: 'Error rejecting booking' });
    }
});

// (Complete Booking route remains the same)
app.put('/owner/bookings/:id/complete', verifyToken, verifyOwner, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const ownerId = req.user.id;

        const booking = await BookingModel.findOne({
             _id: bookingId,
             ownerId: ownerId,
             status: { $in: ['Confirmed', 'Upcoming'] }
        }).populate('vehicleId', 'name');

        if (!booking) {
            return res.status(404).json({ message: 'Confirmed or Upcoming booking not found for this owner.' });
        }

        booking.status = 'Completed';
        const updatedBooking = await booking.save();

        await VehicleModel.findByIdAndUpdate(updatedBooking.vehicleId, { isAvailable: true });

        await NotificationModel.create({
             userId: updatedBooking.customerId,
             message: `Your ride for ${booking.vehicleId.name} ending ${new Date(updatedBooking.endDate).toLocaleDateString()} is marked complete. Please leave feedback!`,
             link: `/history`
        });

        res.status(200).json({ message: 'Booking marked as completed.', booking: updatedBooking });
    } catch (error) {
        console.error("❌ Complete Booking Error:", error);
        res.status(500).json({ message: 'Error completing booking' });
    }
});

// MODIFIED: Report damage for a completed booking
// --- USING CLOUDINARY'S 'uploadBookingVideo' MIDDLEWARE ---
app.post('/owner/bookings/:id/report-damage', verifyToken, verifyOwner, uploadBookingVideo.single('damageVideo'), async (req, res) => {
    try {
        const bookingId = req.params.id;
        const ownerId = req.user.id;
        const { description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Damage video is required.' });
        }
        if (!description || description.trim() === '') {
             if (req.file) { await cloudinary.uploader.destroy(req.file.filename, { resource_type: "video" }); }
            return res.status(400).json({ message: 'Damage description is required.' });
        }

        const booking = await BookingModel.findOne({
            _id: bookingId,
            ownerId: ownerId,
        }).populate('customerId vehicleId');

        if (!booking) {
             if (req.file) { await cloudinary.uploader.destroy(req.file.filename, { resource_type: "video" }); }
            return res.status(404).json({ message: 'Booking not found for this owner.' });
        }

         if (new Date(booking.endDate) > new Date()) {
              if (req.file) { await cloudinary.uploader.destroy(req.file.filename, { resource_type: "video" }); }
              return res.status(400).json({ message: 'Cannot report damage before the booking end date.' });
         }


        // Create the damage report
        const newReport = await DamageReportModel.create({
            bookingId: booking._id,
            ownerId: ownerId,
            customerId: booking.customerId._id,
            vehicleId: booking.vehicleId._id,
            description: description.trim(),
            preRideVideo: booking.preRideVideo, // This is now a Cloudinary URL
            damageVideo: req.file.path, // This is now a Cloudinary URL
            status: 'Pending Review'
        });

        await VehicleModel.findByIdAndUpdate(booking.vehicleId._id, { isAvailable: false });

        res.status(201).json({ message: 'Damage report submitted successfully. Vehicle marked as unavailable.', report: newReport });

    } catch (error) {
        console.error("❌ Report Damage Error:", error);
        if (req.file) {
           try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: "video" }); } catch(e){ console.error("Cleanup Error Report Damage:", e);}
        }
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: `Video upload error: ${error.message}` });
        }
        if (error.message.includes('Invalid file type')) {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error submitting damage report.' });
    }
});


// (Get Owner Damage Reports route remains the same)
app.get('/owner/damage-reports', verifyToken, verifyOwner, async (req, res) => {
    try {
        const ownerId = req.user.id;
        const reports = await DamageReportModel.find({ ownerId })
            .populate('customerId', 'fullName')
            .populate('vehicleId', 'name')
            .populate('bookingId', '_id')
            .sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error("❌ Get Owner Damage Reports Error:", error);
        res.status(500).json({ message: 'Error fetching damage reports.' });
    }
});



// -------------------- Complaint Routes --------------------
// (These routes remain the same)
app.post('/complaints/customer', verifyToken, async (req, res) => {
    if (!req.user || req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Only customers can submit complaints.' });
    }
    try {
        const { subject, description } = req.body;
        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required.' });
        }
        const newComplaint = await ComplaintModel.create({
            userId: req.user.id,
            subject,
            description,
            status: 'Open'
        });
        res.status(201).json({ message: 'Complaint submitted successfully.', complaint: newComplaint });
    } catch (error) {
        console.error("❌ Create Customer Complaint Error:", error);
        res.status(500).json({ message: 'Error submitting complaint.' });
    }
});
app.get('/complaints/customer', verifyToken, async (req, res) => {
    if (!req.user || req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Access denied. Customers only.' });
    }
    try {
        const complaints = await ComplaintModel.find({ userId: req.user.id })
            .populate('replies.adminId', 'fullName')
            .sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        console.error("❌ Get Customer Complaints Error:", error);
        res.status(500).json({ message: 'Error fetching complaints.' });
    }
});
app.post('/complaints/owner', verifyToken, verifyOwner, async (req, res) => {
    try {
        const { subject, description } = req.body;
        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required.' });
        }
        const newComplaint = await ComplaintModel.create({
            userId: req.user.id,
            subject,
            description,
            status: 'Open'
        });
        res.status(201).json({ message: 'Complaint submitted successfully.', complaint: newComplaint });
    } catch (error) {
        console.error("❌ Create Owner Complaint Error:", error);
        res.status(500).json({ message: 'Error submitting complaint.' });
    }
});
app.get('/complaints/owner', verifyToken, verifyOwner, async (req, res) => {
    try {
        const complaints = await ComplaintModel.find({ userId: req.user.id })
            .populate('replies.adminId', 'fullName')
            .sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        console.error("❌ Get Owner Complaints Error:", error);
        res.status(500).json({ message: 'Error fetching complaints.' });
    }
});

// -------------------- Review Routes --------------------
// (These routes remain the same)
app.post('/reviews', verifyToken, async (req, res) => {
     if (req.user.role !== 'Customer') {
         return res.status(403).json({ message: 'Only customers can leave reviews.' });
     }
     try {
         const { bookingId, vehicleId, ownerId, vehicleRating, ownerRating, comment } = req.body;
         const reviewerId = req.user.id;

         if (!bookingId || !vehicleId || !ownerId || !vehicleRating || !ownerRating) {
             return res.status(400).json({ message: 'Missing required review fields.' });
         }
         if (![1, 2, 3, 4, 5].includes(parseInt(vehicleRating)) || ![1, 2, 3, 4, 5].includes(parseInt(ownerRating))) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
         }
         const existingReview = await ReviewModel.findOne({ bookingId, reviewerId });
         if(existingReview) {
            return res.status(400).json({ message: 'Feedback already submitted for this booking.' });
         }
         const booking = await BookingModel.findOne({ _id: bookingId, customerId: reviewerId });
         if (!booking) {
             return res.status(404).json({ message: 'Booking not found.' });
         }
         if (booking.status !== 'Completed') {
            return res.status(400).json({ message: 'Cannot review a booking that is not completed.' });
         }
         if (booking.feedbackGiven) {
            return res.status(400).json({ message: 'Feedback already submitted for this booking (checked DB).' });
         }

         await ReviewModel.create({
             bookingId, vehicleId, reviewerId,
             revieweeId: ownerId,
             rating: parseInt(vehicleRating),
             comment: comment || '',
             reviewType: 'Vehicle'
         });
          await ReviewModel.create({
             bookingId, vehicleId, reviewerId,
             revieweeId: ownerId,
             rating: parseInt(ownerRating),
             comment: comment || '',
             reviewType: 'Owner'
         });

         booking.feedbackGiven = true;
         await booking.save();

         res.status(201).json({ message: "Feedback submitted successfully!" });

     } catch (error) {
         console.error("❌ Create Review Error:", error);
         res.status(500).json({ message: 'Error submitting review.' });
     }
});
app.get('/owner/ratings', verifyToken, verifyOwner, async (req, res) => {
    try {
        const ownerId = req.user.id;
        const ownerVehicleIds = await VehicleModel.find({ ownerId }).distinct('_id');

        const ratings = await ReviewModel.find({
            $or: [
                { revieweeId: ownerId, reviewType: 'Owner' },
                { vehicleId: { $in: ownerVehicleIds }, reviewType: 'Vehicle' }
            ]
        })
        .populate('reviewerId', 'fullName')
        .populate('vehicleId', 'name')
        .sort({ createdAt: -1 });

        res.status(200).json(ratings);
    } catch (error) {
        console.error("❌ Get Owner Ratings Error:", error);
        res.status(500).json({ message: 'Error fetching ratings.' });
    }
});
app.get('/reviews/customer', verifyToken, async (req, res) => {
    if (req.user.role !== 'Customer') {
        return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        const customerId = req.user.id;
        const ratings = await ReviewModel.find({ revieweeId: customerId, reviewType: 'Customer' })
            .populate('reviewerId', 'fullName')
            .populate('bookingId', 'vehicleId')
            .populate({
                 path: 'bookingId',
                 populate: { path: 'vehicleId', select: 'name' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(ratings);
    } catch (error) {
        console.error("❌ Get Customer Ratings Error:", error);
        res.status(500).json({ message: 'Error fetching ratings received.' });
    }
});




// -------------------- Admin Routes --------------------
// (Admin routes are updated to handle Cloudinary file deletion)
app.get('/admin/users', verifyToken, verifyAdmin, async (req, res) => {
    console.log(`Reached /admin/users route by admin: ${req.user.id}`);
    try {
        const users = await UserModel.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("❌ Get Admin Users Error:", error);
        res.status(500).json({ message: 'Error fetching users.' });
    }
});
app.delete('/admin/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user id.' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.role === 'Admin') return res.status(403).json({ message: 'Cannot delete other Admins.' });

        // --- Cloudinary File Deletion ---
        if (user.licenseFile && (user.licenseFile.includes('cloudinary') || user.licenseFile.startsWith('readygo-images/'))) {
             const publicId = path.parse(user.licenseFile).name;
             try { await cloudinary.uploader.destroy(`readygo-images/${publicId}`); } catch (e) { console.error("Cleanup license file error:", e); }
        }
        if (user.addressFile && (user.addressFile.includes('cloudinary') || user.addressFile.startsWith('readygo-images/'))) {
             const publicId = path.parse(user.addressFile).name;
             try { await cloudinary.uploader.destroy(`readygo-images/${publicId}`); } catch (e) { console.error("Cleanup address file error:", e); }
        }
        // --- End Cloudinary Deletion ---

        if (user.role === 'Owner') {
            const vehicles = await VehicleModel.find({ ownerId: userId });
            for (const v of vehicles) {
                if (v.imageUrl && (v.imageUrl.includes('cloudinary') || v.imageUrl.startsWith('readygo-images/'))) {
                    const publicId = path.parse(v.imageUrl).name;
                    try { await cloudinary.uploader.destroy(`readygo-images/${publicId}`); } catch (e) { console.error("Cleanup vehicle image error:", e); }
                }
                await BookingModel.updateMany(
                     { vehicleId: v._id, status: { $in: ['Pending', 'Confirmed', 'Upcoming'] } },
                     { $set: { status: 'Cancelled' } }
                 );
            }
            await VehicleModel.deleteMany({ ownerId: userId });
        }

        await BookingModel.deleteMany({ $or: [{ customerId: userId }, { ownerId: userId }] });
        await NotificationModel.deleteMany({ userId });
        await ComplaintModel.deleteMany({ userId });
        await ChatModel.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
        await ReviewModel.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] });

        await UserModel.findByIdAndDelete(userId);

        res.status(200).json({ message: 'User and related data removed.' });
    } catch (error) {
        console.error("❌ Delete Admin User Error:", error);
        res.status(500).json({ message: 'Error deleting user.' });
    }
});
app.post('/admin/users/:id/notify', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { message } = req.body;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ message: 'Message is required.' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user id.' });
        }
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const notif = await NotificationModel.create({
            userId,
            message: message.trim()
        });

        res.status(201).json({ message: 'Notification sent.', notification: notif });
    } catch (error) {
        console.error("❌ Admin Notify Error:", error);
        res.status(500).json({ message: 'Error sending notification.' });
    }
});
app.put('/admin/users/:id/lock', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { lockDurationInHours } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user id.' });
        }
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
         if (user.role === 'Admin') return res.status(403).json({ message: 'Cannot lock other Admins.' });


        if (!lockDurationInHours || Number(lockDurationInHours) <= 0) {
            user.isLocked = false;
            user.lockExpiresAt = null;
            await user.save();
            return res.status(200).json({ message: 'User unlocked.' });
        }

        const hours = Number(lockDurationInHours);
        if (isNaN(hours) || hours < 0) {
            return res.status(400).json({ message: 'Invalid lock duration.' });
        }
        const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
        user.isLocked = true;
        user.lockExpiresAt = expiresAt;
        await user.save();

        res.status(200).json({ message: `User locked for ${hours} hour(s).`, lockExpiresAt: user.lockExpiresAt });
    } catch (error) {
        console.error("❌ Admin Lock Error:", error);
        res.status(500).json({ message: 'Error updating lock status.' });
    }
});
app.put('/admin/users/:id/verify', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { licenseStatus, addressStatus } = req.body;
        const update = {};
        const allowedStatuses = ['Verified', 'Rejected', 'Pending Review', 'Not Uploaded'];

        if (licenseStatus !== undefined) {
             if (!allowedStatuses.includes(licenseStatus)) return res.status(400).json({ message: 'Invalid license status.' });
             update.licenseStatus = licenseStatus;
        }
        if (addressStatus !== undefined) {
              if (!allowedStatuses.includes(addressStatus)) return res.status(400).json({ message: 'Invalid address status.' });
              update.addressStatus = addressStatus;
        }

        if (Object.keys(update).length === 0) {
             return res.status(400).json({ message: 'No valid status provided for update.' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user id.' });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

         let notifMessage = `Your document verification status changed.`;
         if (update.licenseStatus) notifMessage += ` License: ${update.licenseStatus}`;
         if (update.addressStatus) notifMessage += ` Address: ${update.addressStatus}`;
         if (update.licenseStatus === 'Rejected' || update.addressStatus === 'Rejected') {
              notifMessage += ` Please re-upload correct documents.`;
         }

        await NotificationModel.create({
            userId,
            message: notifMessage,
            link: '/customer/verify'
        });

        res.status(200).json({ message: 'User verification updated.', user: updatedUser });
    } catch (error) {
        console.error("❌ Admin Verify User Error:", error);
        res.status(500).json({ message: 'Error updating verification.' });
    }
});
app.get('/admin/vehicles', verifyToken, verifyAdmin, async (req, res) => {
    console.log(`Reached /admin/vehicles route by admin: ${req.user.id}`);
    try {
        const vehicles = await VehicleModel.find()
            .populate('ownerId', 'fullName email')
            .sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        console.error("❌ Get Admin Vehicles Error:", error);
        res.status(500).json({ message: 'Error fetching vehicles.' });
    }
});
app.get('/admin/bookings', verifyToken, verifyAdmin, async (req, res) => {
    console.log(`Reached /admin/bookings route by admin: ${req.user.id}`);
    try {
        const bookings = await BookingModel.find()
            .populate('customerId', 'fullName email phone')
            .populate('ownerId', 'fullName email phone')
            .populate('vehicleId', 'name plate pricePerDay')
            .sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        console.error("❌ Get Admin Bookings Error:", error);
        res.status(500).json({ message: 'Error fetching bookings.' });
    }
});
app.get('/admin/complaints', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const complaints = await ComplaintModel.find({ status: 'Open' })
            .populate('userId', 'fullName email')
            .sort({ createdAt: 1 });
        res.status(200).json(complaints);
    } catch (error) {
        console.error("❌ Get Admin Complaints Error:", error);
        res.status(500).json({ message: 'Error fetching complaints.' });
    }
});
app.put('/admin/complaints/:id/resolve', verifyToken, verifyAdmin, async (req, res) => {
    try {
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid complaint id.' });
        }
        const updatedComplaint = await ComplaintModel.findByIdAndUpdate(
            req.params.id,
            { status: 'Resolved' },
            { new: true }
        );
        if (!updatedComplaint) return res.status(404).json({ message: 'Complaint not found.' });

        await NotificationModel.create({
             userId: updatedComplaint.userId,
             message: `Your complaint regarding "${updatedComplaint.subject}" has been marked as resolved.`,
             link: '/customer/complaints'
        });

        res.status(200).json({ message: 'Complaint resolved.', complaint: updatedComplaint });
    } catch (error) {
        console.error("❌ Resolve Complaint Error:", error);
        res.status(500).json({ message: 'Error resolving complaint.' });
    }
});
app.post('/admin/complaints/:id/reply', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Reply message is required.' });
        }
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid complaint id.' });
        }

        const complaint = await ComplaintModel.findById(req.params.id).populate('userId', 'role'); // Populate user role
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found.' });
        }

        const reply = {
            adminId: req.user.id,
            message: message.trim(),
            createdAt: new Date()
        };
        complaint.replies.push(reply);
        complaint.status = 'Open';
        await complaint.save();

        await NotificationModel.create({
            userId: complaint.userId._id, // Use populated user ID
            message: `You have a new reply from Admin regarding your complaint: "${complaint.subject}"`,
            link: `/${complaint.userId.role.toLowerCase()}/complaints` // Dynamic link
        });

        res.status(201).json({ message: 'Reply added successfully.', complaint });
    } catch (error) {
        console.error("❌ Reply Complaint Error:", error);
        res.status(500).json({ message: 'Error adding reply.' });
    }
});
app.get('/admin/reviews/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const aggResult = await ReviewModel.aggregate([
             { $match: { rating: { $in: [1, 2, 3, 4, 5] } } },
             {
                 $group: {
                     _id: "$rating",
                     count: { $sum: 1 }
                 }
             },
            { $sort: { _id: 1 } }
        ]);

         const statsMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
         aggResult.forEach(item => {
             if (item._id >= 1 && item._id <= 5) {
                 statsMap[item._id] = item.count;
             }
         });

         const responseStats = {
             "1_star": statsMap[1],
             "2_star": statsMap[2],
             "3_star": statsMap[3],
             "4_star": statsMap[4],
             "5_star": statsMap[5],
         };

        res.status(200).json(responseStats);
    } catch (error) {
        console.error("❌ Get Admin Reviews Stats Error:", error);
        res.status(500).json({ message: 'Error fetching reviews stats.' });
    }
});
app.get('/admin/settings', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const settings = await SettingsModel.findOneAndUpdate(
             { key: 'platformSettings' },
             { $setOnInsert: { platformFeePercent: 5.0 } },
             { upsert: true, new: true }
         );
        res.status(200).json(settings);
    } catch (error) {
        console.error("❌ Get Admin Settings Error:", error);
        res.status(500).json({ message: 'Error fetching settings.' });
    }
});
app.put('/admin/settings', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { platformFeePercent } = req.body;
        const fee = parseFloat(platformFeePercent);

        if (isNaN(fee) || fee < 0 || fee > 100) {
            return res.status(400).json({ message: 'Invalid platform fee percent. Must be between 0 and 100.' });
        }
        const updatedSettings = await SettingsModel.findOneAndUpdate(
            { key: 'platformSettings' },
            { platformFeePercent: fee },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(200).json(updatedSettings);
    } catch (error) {
        console.error("❌ Update Admin Settings Error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error updating settings.' });
    }
});

// -------------------- Payment Routes (Mock) --------------------
app.get('/payments/cards', verifyToken, (req, res) => { res.json([{ id: 1, last4: '1234', expiry: '12/25' }]); });
app.post('/payments/cards', verifyToken, (req, res) => { res.status(201).json({ message: 'Card added (mock)' }); });
app.delete('/payments/cards/:id', verifyToken, (req, res) => { res.json({ message: 'Card deleted (mock)' }); });

// -------------------- Default Route --------------------
app.get("/", (req, res) => { res.send("✅ READY GO Server is running smoothly."); });

// --- Chat Routes ---
app.get('/chats/conversations', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await ChatModel.aggregate([
            { $match: { $or: [{ senderId: new mongoose.Types.ObjectId(userId) }, { receiverId: new mongoose.Types.ObjectId(userId) }] } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
                            "$receiverId",
                            "$senderId"
                        ]
                    },
                    otherUserId: { $first: { $cond: [{ $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] }, "$receiverId", "$senderId"] } },
                    otherUserName: { $first: { $cond: [{ $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] }, "$receiverName", "$senderName"] } },
                    lastMessage: { $first: "$message" },
                    lastMessageTimestamp: { $first: "$createdAt" }
                }
            },
            { $sort: { lastMessageTimestamp: -1 } },
            {
                $project: {
                    _id: 0,
                    otherUserId: "$otherUserId",
                    otherUserName: "$otherUserName",
                    lastMessage: "$lastMessage",
                    lastMessageTimestamp: "$lastMessageTimestamp"
                }
            }
        ]);

        res.status(200).json(conversations);
    } catch (error) {
        console.error("❌ Fetch Conversations Error:", error);
        res.status(500).json({ message: 'Error fetching conversations' });
    }
});
app.get('/chats/history/:otherUserId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;

        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        const chatHistory = await ChatModel.find({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(chatHistory);
    } catch (error) {
        console.error("❌ Fetch Chat History Error:", error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
});
app.post('/chats', verifyToken, async (req, res) => {
    try {
        const { receiverId, message } = req.body;
        if (!receiverId || !message || message.trim() === '') {
            return res.status(400).json({ message: 'Receiver ID and message are required.' });
        }
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
             return res.status(400).json({ message: 'Invalid receiver ID format.' });
         }

        const senderId = req.user.id;
        const sender = await UserModel.findById(senderId).select('fullName');
        const receiver = await UserModel.findById(receiverId).select('fullName');

        if (!sender) return res.status(404).json({ message: "Sender not found." });
        if (!receiver) return res.status(404).json({ message: "Receiver not found." });

        const newChat = await ChatModel.create({
            senderId,
            receiverId,
            senderName: sender.fullName,
            receiverName: receiver.fullName,
            message: message.trim()
        });

        res.status(201).json({ message: "Message sent", chat: newChat });
    } catch (error) {
        console.error("❌ Send Message Error:", error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// --- Simple Error Handling Middleware (Add at the very end) ---
app.use((err, req, res, next) => {
    console.error("💥 Unhandled Error:", err.stack || err);
    res.status(500).json({ message: 'Something went wrong on the server!' });
});
