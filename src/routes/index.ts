import { Router } from "express";
import authRoutes from "./authRoutes";
import manufacturingOrderRoutes from "./manufacturingOrderRoutes";
import fetchRoutes from "./fetchRoutes";
import workOrderRoutes from "./workOrderRoutes";
import workCenterRoutes from "./workCenterRoutes";
import productPresetsRoutes from "./productPresetsRoutes";
const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/mo", manufacturingOrderRoutes);
apiRoutes.use("/fetch", fetchRoutes);
apiRoutes.use("/wo", workOrderRoutes);
apiRoutes.use("/workCenters", workCenterRoutes);
apiRoutes.use("/productPresets", productPresetsRoutes);
export default apiRoutes;
