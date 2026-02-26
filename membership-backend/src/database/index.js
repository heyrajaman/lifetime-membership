import { sequelize } from "../config/database.js";

// Import Models
import Admin from "./models/Admin.js";
import Member from "./models/Member.js";
import Applicant from "./models/Applicant.js";
import ApprovalToken from "./models/ApprovalToken.js";
import Payment from "./models/Payment.js";
import FileUpload from "./models/FileUpload.js";
import Setting from "./models/Setting.js";

// Define Associations
Member.hasMany(Applicant, {
  foreignKey: "proposer_member_id",
  as: "proposed_applicants",
});
Applicant.belongsTo(Member, {
  foreignKey: "proposer_member_id",
  as: "proposer",
});

Applicant.hasMany(ApprovalToken, {
  foreignKey: "applicant_id",
  as: "approval_tokens",
});
ApprovalToken.belongsTo(Applicant, {
  foreignKey: "applicant_id",
  as: "applicant",
});

Applicant.hasOne(Payment, { foreignKey: "applicant_id", as: "payment" });
Payment.belongsTo(Applicant, { foreignKey: "applicant_id", as: "applicant" });

Applicant.hasMany(FileUpload, { foreignKey: "applicant_id", as: "files" });
FileUpload.belongsTo(Applicant, {
  foreignKey: "applicant_id",
  as: "applicant",
});

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ All database models synchronized successfully.");
  } catch (error) {
    console.error("❌ Error synchronizing database models:", error);
  }
};

export {
  sequelize,
  syncDatabase,
  Admin,
  Member,
  Applicant,
  ApprovalToken,
  Payment,
  FileUpload,
  Setting,
};
