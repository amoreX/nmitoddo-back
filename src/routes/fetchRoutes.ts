import { Router } from "express";
import { fetchAll, fetchTable, getAvailableTables } from "../controllers/fetchController";

const fetchRoutes = Router();

// Get all available tables
fetchRoutes.get("/tables", getAvailableTables);

// Fetch all data from all tables
fetchRoutes.get("/all", fetchAll);

// Fetch data from specific table
fetchRoutes.get("/:tableName", fetchTable);

export default fetchRoutes;
