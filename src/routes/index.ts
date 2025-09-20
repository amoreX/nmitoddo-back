import { Router } from "express";
import authRoutes from "./authRoutes";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/manufacture");
export default apiRoutes;
