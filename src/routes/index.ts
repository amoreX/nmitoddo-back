import { Router } from "express";
import authRoutes from "./authRoutes";
import manufacturingOrderRoutes from "./manufacturingOrderRoutes";
import fetchRoutes from "./fetchRoutes";
const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/mo", manufacturingOrderRoutes);
apiRoutes.use("/fetch", fetchRoutes);
export default apiRoutes;
