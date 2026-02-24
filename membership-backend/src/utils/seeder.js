import bcrypt from "bcrypt";
import { sequelize, Admin, Member } from "../database/index.js";
import { testDbConnection } from "../config/database.js";

const seedDatabase = async () => {
  try {
    await testDbConnection();
    await sequelize.sync({ alter: true });

    // 1. Seed Admin (Password updated to pass strict DTO validation)
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

    // 2. Seed President
    const presidentEmail = "president@maharashtramandal.com";
    const existingPresident = await Member.findOne({
      where: { role: "PRESIDENT" },
    });
    if (!existingPresident) {
      await Member.create({
        name: "Shri President",
        email: presidentEmail,
        role: "PRESIDENT",
      });
      console.log("✅ Default President created.");
    }

    // 3. Seed Multiple Proposer Members
    const initialMembers = [
      {
        name: "Aman Singh",
        email: "aman@maharashtramandal.com",
        role: "MEMBER",
      },
      {
        name: "Rahul Sharma",
        email: "rahul@maharashtramandal.com",
        role: "MEMBER",
      },
      {
        name: "Priya Deshmukh",
        email: "priya@maharashtramandal.com",
        role: "MEMBER",
      },
      {
        name: "Vikram Joshi",
        email: "vikram@maharashtramandal.com",
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

    console.log("🌱 Seeding complete! You can now start your server.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
