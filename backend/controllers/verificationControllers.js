const employeeSchema = require("../models/employeeSchema");
const superadminSchema = require("../models/superadminModel");
const bcrypt = require("bcrypt");

const employeeLogin = async (req, res) => {
    try {
        console.log("Welcome to employee login verification", req.body);
        const { username, password } = req.body;
        
        // Find by email (username)
        const empData = await employeeSchema.findOne({ email: username });
        if (!empData) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Secure password comparison with bcrypt, fallback for plain text migration
        let isMatch = false;
        try {
            // Check if it's a bcrypt hash (usually starts with $2b$ or $2a$)
            if (empData.password.startsWith('$2')) {
                isMatch = await bcrypt.compare(password, empData.password);
            } else {
                // Legacy plain text comparison
                isMatch = (password === empData.password);
                
                // OPTIONAL: Automatically hash and update the password on successful login
                if (isMatch) {
                    empData.password = password; // Trigger pre-save hook
                    await empData.save();
                }
            }
        } catch (bcryptErr) {
            console.error("Bcrypt comparison error:", bcryptErr);
            isMatch = (password === empData.password); // Safety fallback
        }

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        console.log("Employee login successful:", empData.email);
        return res.status(200).json({
            message: "Employee login successful",
            employee: empData,
        });
    } catch (err) {
        console.log("Error in employee login verification", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const superadminLogin = async (req, res) => {
    try {
        console.log("Welcome to superadmin login verification", req.body);
        const { username, password } = req.body;
        
        const superadminData = await superadminSchema.findOne({ officeEmail: username });
        if (!superadminData) {
            return res.status(401).json({ message: "Invalid username or password or not a Superadmin" });
        }

        let isMatch = false;
        try {
            if (superadminData.password.startsWith('$2')) {
                isMatch = await bcrypt.compare(password, superadminData.password);
            } else {
                isMatch = (password === superadminData.password);
                
                if (isMatch) {
                    superadminData.password = password; // Trigger pre-save hook
                    await superadminData.save();
                }
            }
        } catch (bcryptErr) {
            console.error("Bcrypt comparison error:", bcryptErr);
            isMatch = (password === superadminData.password);
        }

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password or not a Superadmin" });
        }

        console.log("Superadmin login successful:", superadminData.officeEmail);
        return res.status(200).json({
            message: "Superadmin login successful",
            superadmin: superadminData,
        });
    } catch (err) {
        console.log("Error in superadmin login verification", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    employeeLogin,
    superadminLogin
};
