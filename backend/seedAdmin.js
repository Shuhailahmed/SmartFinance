require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@smartfinance.com";

    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123456", 12);

    const admin = await User.create({
      name: "Smart Finance Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      currency: "INR",
      isActive: true,
    });

    console.log("Admin created successfully.");
    console.log("Email:", admin.email);

    process.exit(0);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exit(1);
  }
};

createAdmin();
