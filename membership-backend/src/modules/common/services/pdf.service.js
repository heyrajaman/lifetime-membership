import PDFDocument from "pdfkit";

class PdfService {
  /**
   * Generates a digital ID card as a Buffer in memory
   * @param {Object} memberData - The member's details (must include photo_url and address)
   * @returns {Promise<Buffer>} - The generated PDF buffer
   */
  async generateIdCardBuffer(memberData) {
    return new Promise(async (resolve, reject) => {
      try {
        // Standard ID Card size (3.375" x 2.125" at 72 DPI)
        const doc = new PDFDocument({
          size: [243, 153],
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });

        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // 1. Background
        doc.rect(0, 0, 243, 153).fill("#f8f9fa");

        // 2. Header Section
        doc
          .fillColor("#003366")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("Maharashtra Mandal Raipur", 0, 12, {
            align: "center",
            width: 243,
          });

        doc
          .fillColor("#d9534f")
          .fontSize(7)
          .text("LIFETIME MEMBER", 0, 25, { align: "center", width: 243 });

        // Dividing line
        doc
          .moveTo(10, 35)
          .lineTo(233, 35)
          .lineWidth(1)
          .strokeColor("#cccccc")
          .stroke();

        // 3. Profile Photo (Left Side)
        if (memberData.photo_url) {
          try {
            // Fetch the image from MinIO URL into an ArrayBuffer
            const response = await fetch(memberData.photo_url);
            const arrayBuffer = await response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);

            // Draw image at (X: 10, Y: 45) with Width: 55, Height: 70
            doc.image(imageBuffer, 10, 45, { width: 55, height: 70 });

            // Add a thin border around the photo
            doc
              .rect(10, 45, 55, 70)
              .lineWidth(0.5)
              .strokeColor("#999999")
              .stroke();
          } catch (imgErr) {
            console.error("Failed to load profile photo for PDF:", imgErr);
            // Fallback placeholder if image fails to load
            doc.rect(10, 45, 55, 70).fillAndStroke("#eeeeee", "#cccccc");
            doc
              .fillColor("#999999")
              .fontSize(6)
              .text("NO PHOTO", 10, 75, { width: 55, align: "center" });
          }
        }

        // 4. Member Details (Right Side)
        const startX = 75;
        let currentY = 45;

        // Name
        doc
          .fillColor("#333333")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(memberData.name, startX, currentY);
        currentY += 13;

        // Reg No
        doc
          .fontSize(7)
          .font("Helvetica")
          .text(`Reg No: `, startX, currentY, { continued: true })
          .font("Helvetica-Bold")
          .text(memberData.registration_number);
        currentY += 10;

        // Mobile
        doc
          .font("Helvetica")
          .text(`Mobile: `, startX, currentY, { continued: true })
          .font("Helvetica-Bold")
          .text(memberData.mobile_number);
        currentY += 10;

        // Email
        doc
          .font("Helvetica")
          .text(`Email: `, startX, currentY, { continued: true })
          .font("Helvetica-Bold")
          .text(memberData.email);
        currentY += 10;

        // Address (Wrapped text)
        doc
          .font("Helvetica")
          .text(`Address: ${memberData.address}`, startX, currentY, {
            width: 158, // Prevents text from going off the right edge
            lineGap: 1,
            height: 30, // Restrict height so it doesn't overflow the bottom
            ellipsis: true, // Adds "..." if address is too long
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PdfService();
