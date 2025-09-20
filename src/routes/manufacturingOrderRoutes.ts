import { Router } from "express";
import {
  createManufacturingOrder,
  draftManufacturingOrder,
} from "../controllers/manufacturingOrderController";


const manufacturingOrderRoutes = Router();

// Create a new Manufacturing Order
manufacturingOrderRoutes.post("/new", createManufacturingOrder);

// fetch list of available shit
// mo/save draft -> all these fields and list of comps and list of work orders in input -> save that shit in db and keep shit draft

manufacturingOrderRoutes.post("/save-draft", draftManufacturingOrder);
export default manufacturingOrderRoutes;
