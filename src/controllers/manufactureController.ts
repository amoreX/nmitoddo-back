import { Request, Response } from "express";
import { NewOrder } from "../services/manufactureService";
export const NewManufacturingOrder = async (req: Request, res: Response) => {
  //change the details
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res
      .status(400)
      .json({ message: "Login Id and password are required." });
  }

  try {
    // if (result.status) {
    //   return res
    //     .status(200)
    //     .json({ message: result.message, user: result.user });
    // } else {
    //   return res.status(401).json({ message: result.message });
    // }
    return res.status(500).json({ message: "message" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

export const DraftManufacturingOrder = async (req: Request, res: Response) => {
  //change the details
  const { loginId, email, password } = req.body;

  if (!email || !password || !loginId) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    return res.status(409).json({ message: "result.message" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};
