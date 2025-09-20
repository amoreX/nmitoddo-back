import { Router } from "express";
import authRoutes from "./authRoutes";
import manufacturingOrderRoutes from "./manufacturingOrderRoutes";
import bomRoutes from "./bomRoutes";
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
apiRoutes.use("/profile", profileRoutes);
apiRoutes.use("/mo", manufacturingOrderRoutes);
apiRoutes.use("/bom", bomRoutes);
apiRoutes.use("/fetch", fetchRoutes);
apiRoutes.use("/wo", workOrderRoutes);
apiRoutes.use("/workCenters", workCenterRoutes);
apiRoutes.use("/moPresets", moPresetsRoutes);
apiRoutes.use("/stock", stockRoutes); 
apiRoutes.use("/products", productRoutes); 
apiRoutes.use("/reports", reportRoutes); 

export default apiRoutes;
