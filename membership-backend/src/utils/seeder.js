import bcrypt from "bcrypt";
import { sequelize, Admin, Member, Setting } from "../database/index.js";
import { testDbConnection } from "../config/database.js";

const seedDatabase = async () => {
  try {
    await testDbConnection();
    await sequelize.sync({ alter: true });

    // 1. Seed Admin
    const adminPhone = "9999999999";
    const existingAdmin = await Admin.findOne({
      where: { phone_number: adminPhone },
    });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Admin@1234", 10);
      await Admin.create({
        phone_number: adminPhone,
        password: hashedPassword,
      });
      console.log(
        "✅ Default Admin created. Phone: 9999999999 | Pass: Admin@1234",
      );
    }

    // 2. Seed President (Added Dummy Mobile Number)
    const presidentEmail = "president@maharashtramandal.com";
    const existingPresident = await Member.findOne({
      where: { role: "PRESIDENT" },
    });
    if (!existingPresident) {
      await Member.create({
        name: "Shri President",
        email: presidentEmail,
        mobile_number: "9000000001", // NEW: Unique mobile number
        role: "PRESIDENT",
      });
      console.log("✅ Default President created.");
    }

    // 3. Seed Multiple Proposer Members (Added Dummy Mobile Numbers)
    const initialMembers = [
      {
        name: "Aman Singh",
        email: "aman@maharashtramandal.com",
        mobile_number: "9000000002", // NEW: Unique mobile number
        role: "MEMBER",
      },
      {
        name: "Rahul Sharma",
        email: "rahul@maharashtramandal.com",
        mobile_number: "9000000003", // NEW: Unique mobile number
        role: "MEMBER",
      },
      {
        name: "Priya Deshmukh",
        email: "priya@maharashtramandal.com",
        mobile_number: "9000000004", // NEW: Unique mobile number
        role: "MEMBER",
      },
      {
        name: "Vikram Joshi",
        email: "vikram@maharashtramandal.com",
        mobile_number: "9000000005", // NEW: Unique mobile number
        role: "MEMBER",
      },
    ];

    for (const memberData of initialMembers) {
      const existingMember = await Member.findOne({
        where: { email: memberData.email },
      });
      if (!existingMember) {
        await Member.create(memberData);
        console.log(`✅ Member created: ${memberData.name}`);
      }
    }

    console.log("⚙️ Setting up default system settings...");
    await Setting.upsert({
      key: "LIFETIME_MEMBERSHIP_FEE",
      value: "1510",
    });
    console.log("✅ Default Membership Fee set to 1510.");

    console.log("🌱 Seeding complete! You can now start your server.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
