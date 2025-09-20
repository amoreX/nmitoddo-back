import { Router } from "express";
import authRoutes from "./authRoutes";
import manufacturingOrderRoutes from "./manufacturingOrderRoutes";
const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/manufacturing-orders", manufacturingOrderRoutes);
export default apiRoutes;
