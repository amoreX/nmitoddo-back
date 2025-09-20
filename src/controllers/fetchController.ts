import { Request, Response } from "express";
import { fetchAllData, fetchTableData } from "../services/fetchService";

export const fetchAll = async (req: Request, res: Response) => {
  try {
    const result = await fetchAllData();

    if (result.status) {
      return res.status(200).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(500).json({
        message: result.message,
      });
    }
  } catch (err: any) {
    console.error("Error in fetchAll controller:", err);
    return res.status(500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

export const fetchTable = async (req: Request, res: Response) => {
  const { tableName } = req.params;

  if (!tableName) {
    return res.status(400).json({
      message: "Table name is required",
    });
  }

  try {
    const result = await fetchTableData(tableName);

    if (result.status) {
      return res.status(200).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        message: result.message,
      });
    }
  } catch (err: any) {
    console.error(`Error in fetchTable controller for ${tableName}:`, err);
    return res.status(500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAvailableTables = async (req: Request, res: Response) => {
  try {
    const availableTables = [
      "users",
      "sessions",
      "products",
      "billofmaterials",
      "manufacturingorders",
      "workorders",
      "workcenters",
      "productledgers",
      "productstocks",
      "reports"
    ];

    return res.status(200).json({
      message: "Available tables fetched successfully",
      data: {
        tables: availableTables,
        count: availableTables.length
      }
    });
  } catch (err: any) {
    console.error("Error in getAvailableTables controller:", err);
    return res.status(500).json({
      message: err.message || "Internal Server Error",
    });
  }
};
