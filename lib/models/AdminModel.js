import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    role: {
        type: String,
        enum: ["admin", "super_admin"],
        default: "admin",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Sub-admins start as false; super_admin is always true
    isApproved: {
        type: Boolean,
        default: false,
    },
    // 'credentials' = username+password, 'google' = Google OAuth
    authProvider: {
        type: String,
        enum: ["credentials", "google"],
        default: "credentials",
    },
    // Google profile ID for OAuth users
    googleId: {
        type: String,
        sparse: true,
        default: null,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);
