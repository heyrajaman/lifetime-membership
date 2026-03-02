import { Region } from "../../../database/index.js";

class RegionController {
  // 1. PUBLIC: Fetch all active regions for the frontend dropdown
  async getActiveRegions(req, res) {
    try {
      const regions = await Region.findAll({
        where: { is_active: true },
        attributes: ["id", "name"],
        order: [["name", "ASC"]], // Alphabetical order looks best in dropdowns
      });
      return res.status(200).json({ success: true, data: regions });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch regions.",
      });
    }
  }

  // 2. ADMIN: Fetch ALL regions (including inactive ones) for the dashboard
  async getAllRegionsForAdmin(req, res) {
    try {
      const regions = await Region.findAll({
        order: [["name", "ASC"]],
      });
      return res.status(200).json({ success: true, data: regions });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. ADMIN: Add a new region
  async createRegion(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: "Region name is required." });
      }

      const newRegion = await Region.create({ name: name.trim() });
      return res.status(201).json({
        success: true,
        message: "Region added successfully.",
        data: newRegion,
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json({ success: false, message: "This region already exists." });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. ADMIN: Toggle a region's visibility (Hide/Show in frontend)
  async toggleRegionStatus(req, res) {
    try {
      const { id } = req.params;
      const region = await Region.findByPk(id);

      if (!region) {
        return res
          .status(404)
          .json({ success: false, message: "Region not found." });
      }

      region.is_active = !region.is_active;
      await region.save();

      return res.status(200).json({
        success: true,
        message: `${region.name} is now ${region.is_active ? "Visible" : "Hidden"} in the form.`,
        data: region,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new RegionController();
