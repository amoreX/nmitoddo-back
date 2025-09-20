import { Router } from "express";
import authRoutes from "./authRoutes";
import manufactureRoutes from "./manufactureRoutes";
const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/manufacture", manufactureRoutes);
export default apiRoutes;
