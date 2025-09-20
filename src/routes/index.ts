import { Router } from "express";
import authRoutes from "./authRoutes";
import manufacturingOrderRoutes from "./manufacturingOrderRoutes";
const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/mo", manufacturingOrderRoutes);
export default apiRoutes;
