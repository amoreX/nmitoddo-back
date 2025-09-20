import express from "express";
import apiRoutes from "./routes";
import cors from "cors";
import prisma from "./prisma";
import bcrypt from "bcrypt";

const app = express();
const PORT = 3000;
app.use(cors({ origin: "*" }));
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory OTP store: { [email]: { otp, time } }
const otpMap: Record<string, { otp: number; time: number }> = {};

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Health check route
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "NMIT Backend API is running",
  });
});

// API routes
app.use("/api", apiRoutes);

// POST /getotp { email }
app.post("/getotp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email required" });
  const otp = generateOTP();
  otpMap[email] = { otp, time: Date.now() };
  // In real app, send OTP via email. Here, return it for testing.
  res.json({ success: true, otp });
});

// POST /resetpass { email, otp, newPass }
app.post("/resetpass", async (req, res) => {
  const { email, otp, newPass } = req.body;
  console.log("/resetpass called");
  console.log("email:", email);
  console.log("otp:", otp);
  console.log("newPass:", newPass);
  console.log("otpMap:", otpMap);
  if (!email || otp === undefined || !newPass) {
    console.log("Missing fields");
    return res.status(400).json({ success: false, error: "Missing fields" });
  }
  const entry = otpMap[email];
  if (!entry) {
    console.log("No OTP requested for this email");
    return res.status(400).json({ success: false, error: "No OTP requested for this email" });
  }
  const now = Date.now();
  if (entry.otp !== Number(otp)) {
    console.log(`Invalid OTP: expected ${entry.otp}, got ${otp}`);
    return res.status(400).json({ success: false, error: "Invalid OTP" });
  }
  if (now - entry.time > 10 * 60 * 1000) {
    console.log("OTP expired");
    return res.status(400).json({ success: false, error: "OTP expired" });
  }
  // Update password
  try {
    const hash = await bcrypt.hash(newPass, 10);
    const user = await prisma.user.update({ where: { email }, data: { password: hash } });
    delete otpMap[email];
    console.log("Password updated for email:", email);
    res.json({ success: true, message: "Password updated" });
  } catch (e) {
    console.log("Error updating password:", e);
    res.status(400).json({ success: false, error: "User not found or error updating password" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
