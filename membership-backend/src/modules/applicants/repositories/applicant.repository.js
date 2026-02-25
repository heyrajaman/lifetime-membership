import {
  Applicant,
  Member,
  FileUpload,
  Payment,
} from "../../../database/index.js";

class ApplicantRepository {
  // Creates a new applicant, optionally within a database transaction
  async create(applicantData, transaction = null) {
    return await Applicant.create(applicantData, { 
      include: [{ model: FileUpload, as: 'files' }],
      transaction });
  }

  // Fetches an applicant by ID, including their proposer, uploaded files, and payment status
  async findById(id) {
    return await Applicant.findByPk(id, {
      include: [
        { model: Member, as: "proposer", attributes: ["id", "name", "email"] },
        {
          model: FileUpload,
          as: "files",
          attributes: ["file_type", "minio_url"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["amount", "status", "razorpay_order_id"],
        },
      ],
    });
  }

  // Updates the workflow status of an applicant
  async updateStatus(id, newStatus, transaction = null) {
    return await Applicant.update(
      { status: newStatus },
      { where: { id }, transaction },
    );
  }

  // Fetches all applicants for the Admin dashboard
  async findAll(filters = {}) {
    return await Applicant.findAll({
      where: filters,
      order: [["createdAt", "DESC"]],
      include: [{ model: Member, as: "proposer", attributes: ["name"] }],
    });
  }
}

export default new ApplicantRepository();
