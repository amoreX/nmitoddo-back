import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import prisma from "../prisma";

const profileRoutes = Router();

/**
 * GET /profile - Get current user profile (Protected Route Example)
 * 
 * Headers required:
 * Authorization: Bearer <jwt_token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "id": 1,
 *     "email": "alice@example.com",
 *     "name": "Alice Admin",
 *     "role": "user",
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
profileRoutes.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; // We know this exists because authMiddleware validated it

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
        // Explicitly exclude password field
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/**
 * PUT /profile - Update current user profile (Protected Route Example)
 * 
 * Headers required:
 * Authorization: Bearer <jwt_token>
 * 
 * Body:
 * {
 *   "name": "Updated Name" // optional
 * }
 */
profileRoutes.put("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

export default profileRoutes;