const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Escape HTML special characters
const escapeHTML = (value) => {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
};

// Send verification email
const sendVerificationEmail = async (email, otp, name) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const safeName = escapeHTML(name);

  const { data, error } = await resend.emails.send({
    from: "Smart Finance <onboarding@resend.dev>",
    to: ["shuhailahmed202020@gmail.com"],
    subject: "Verify your Smart Finance account",

    text: `Hello ${name}, your verification OTP is ${otp}. It expires in 5 minutes.`,

    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#059669;">Smart Finance</h2>
        <h3>Email Verification</h3>
        <p>Hello ${safeName},</p>
        <p>Use the following OTP to verify your email address:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f0fdf4;padding:18px;text-align:center;border-radius:8px;">
          ${otp}
        </div>
        <p>This OTP expires in <strong>5 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:24px;" />
        <p style="font-size:12px;color:#9ca3af;">
          Smart Finance Account Security
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(error.message || "Failed to send verification email.");
  }

  console.log("Verification email sent:", data.id);

  return data;
};

module.exports = { sendVerificationEmail };
