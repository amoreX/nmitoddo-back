import { Router } from "express";
import authRoutes from "./authRoutes";
import manufacturingOrderRoutes from "./manufacturingOrderRoutes";
import fetchRoutes from "./fetchRoutes";
import workOrderRoutes from "./workOrderRoutes";
import workCenterRoutes from "./workCenterRoutes";
import moPresetsRoutes from "./moPresetsRoutes";
import profileRoutes from "./profileRoutes";
import stockRoutes from "./stockRoutes";
import productRoutes from "./productRoutes";
import reportRoutes from "./reportRoutes";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/profile", profileRoutes); // Protected route example
apiRoutes.use("/mo", manufacturingOrderRoutes);
apiRoutes.use("/fetch", fetchRoutes);
apiRoutes.use("/wo", workOrderRoutes);
apiRoutes.use("/workCenters", workCenterRoutes);
apiRoutes.use("/moPresets", moPresetsRoutes);
apiRoutes.use("/stock", stockRoutes); // Stock management routes
apiRoutes.use("/products", productRoutes); // Product CRUD routes
apiRoutes.use("/reports", reportRoutes); // Manufacturing reports with PDF generation

export default apiRoutes;
