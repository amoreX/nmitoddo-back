import { Request, Response } from "express";
import {
  createBOMService,
  getAllBOMsService,
  getBOMByProductIdService,
  updateBOMService,
  deleteBOMService,
  checkBOMUsageService,
} from "../services/bomService";

// POST /api/bom - Create new BOM
export const createBOM = async (req: Request, res: Response) => {
  try {
    const { productId, components } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Components array is required and must not be empty"
      });
    }

    // Validate each component
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      
      if (!component.componentId) {
        return res.status(400).json({
          success: false,
          message: `Component at index ${i} must have componentId`
        });
      }

      if (!component.quantity || component.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Component at index ${i} must have valid quantity > 0`
        });
      }

      if (component.opDurationMins && component.opDurationMins < 0) {
        return res.status(400).json({
          success: false,
          message: `Component at index ${i} opDurationMins must be >= 0`
        });
      }
    }

    const bom = await createBOMService({ productId, components });

    res.status(201).json({
      success: true,
      data: bom,
      message: `BOM created successfully for product ${bom.product.name} with ${bom.componentCount} components`
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('BOM already exists')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.message.includes('Components not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/bom - List all BOMs with filtering
export const getAllBOMs = async (req: Request, res: Response) => {
  try {
    const {
      productId,
      limit = "50",
      offset = "0",
    } = req.query;

    const filters: any = {};
    
    if (productId && typeof productId === 'string') {
      const parsedProductId = parseInt(productId);
      if (isNaN(parsedProductId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid productId parameter"
        });
      }
      filters.productId = parsedProductId;
    }
    
    filters.limit = parseInt(limit as string);
    filters.offset = parseInt(offset as string);

    if (filters.limit <= 0 || filters.limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100"
      });
    }

    if (filters.offset < 0) {
      return res.status(400).json({
        success: false,
        message: "Offset must be >= 0"
      });
    }

    const result = await getAllBOMsService(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/bom/:productId - Get BOM for specific product
export const getBOMByProductId = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const parsedProductId = parseInt(productId);
    
    if (isNaN(parsedProductId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID"
      });
    }

    const bom = await getBOMByProductIdService(parsedProductId);

    res.status(200).json({
      success: true,
      data: bom
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'BOM not found for this product') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/bom/:productId - Update existing BOM
export const updateBOM = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { components } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const parsedProductId = parseInt(productId);
    
    if (isNaN(parsedProductId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID"
      });
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Components array is required and must not be empty"
      });
    }

    // Validate each component
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      
      if (!component.componentId) {
        return res.status(400).json({
          success: false,
          message: `Component at index ${i} must have componentId`
        });
      }

      if (!component.quantity || component.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Component at index ${i} must have valid quantity > 0`
        });
      }

      if (component.opDurationMins && component.opDurationMins < 0) {
        return res.status(400).json({
          success: false,
          message: `Component at index ${i} opDurationMins must be >= 0`
        });
      }
    }

    const updatedBOM = await updateBOMService(parsedProductId, { components });

    res.status(200).json({
      success: true,
      data: updatedBOM,
      message: `BOM updated successfully for product ${updatedBOM.product.name} with ${updatedBOM.componentCount} components`
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'BOM not found for this product. Use create endpoint to create a new BOM.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('Components not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/bom/:productId - Delete BOM
export const deleteBOM = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const parsedProductId = parseInt(productId);
    
    if (isNaN(parsedProductId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID"
      });
    }

    const result = await deleteBOMService(parsedProductId);

    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'BOM not found for this product') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('Cannot delete BOM. It is used in active Manufacturing Orders')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/bom/:productId/usage - Check BOM usage in active MOs
export const checkBOMUsage = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const parsedProductId = parseInt(productId);
    
    if (isNaN(parsedProductId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID"
      });
    }

    const usage = await checkBOMUsageService(parsedProductId);

    res.status(200).json({
      success: true,
      data: usage
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};