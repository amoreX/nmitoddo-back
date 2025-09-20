import { Router } from "express";
import {
  NewManufacturingOrder,
  DraftManufacturingOrder,
} from "../controllers/manufactureController";
const manufactureRoutes = Router();

manufactureRoutes.post("/new", NewManufacturingOrder);
manufactureRoutes.post("/draft", DraftManufacturingOrder);
// new MO -> returns MO ID / object default draft
// draft MO ->  update the databse with new MO details -> return ledger items
// save MO -> can only be triggered when all items are availiable  , save status update MO

export default manufactureRoutes;
