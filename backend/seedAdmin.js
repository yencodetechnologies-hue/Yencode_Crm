const mongoose = require("mongoose");
const connectDB = require("./config/db");
const SuperAdmin = require("./models/superadminModel");

const run = async () => {
  try {
    await connectDB();

    const officeEmail = "admin@gmail.com";

    let existing = await SuperAdmin.findOne({ officeEmail });
    if (existing) {
      console.log("Superadmin already exists:", officeEmail);
      return;
    }

    const admin = new SuperAdmin({
      name: "Admin User",
      officeEmail,
      password: "Admin@123",
      adminType: "Superadmin",
      role: "Superadmin",
    });

    await admin.save();
    console.log("Superadmin created:", officeEmail);
  } catch (err) {
    console.error("Error seeding superadmin:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();

