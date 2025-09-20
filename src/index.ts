import express from "express";
import apiRoutes from "./routes";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "NMIT Backend API is running 🚀",
  });
});

// API routes
app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
