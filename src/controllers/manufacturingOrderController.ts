import { Request, Response } from "express";
import {
  createManufacturingOrderService,
  saveDraftManufacturingOrderService,
  getDashboardMOsService,
  getMOWithDetailsService,
  updateMOStatusService,
  deleteMOService,
  getComponentAvailabilityService,
  validateMOService,
  getBOMPopulationService,
  createManufacturingOrderWithBOMService,
  getDashboardKPIsService,
} from "../services/manufactureService";
import { OrderStatus } from "@prisma/client";
export const createManufacturingOrder = async (req: Request, res: Response) => {
  try {
    const { userId, productId, quantity, scheduleStartDate, deadline } = req.body;
    
    // Use userId from body, or fallback to authenticated user ID, or default to 10
    const createdById = userId || req.userId || 10;

    const mo = await createManufacturingOrderService(
      createdById,
      productId,
      quantity,
      scheduleStartDate,
      deadline
    );

    res.status(201).json({ success: true, data: mo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const draftManufacturingOrder = async (req: Request, res: Response) => {
  try {
    // Destructure all fields sent from frontend
    const {
      id,
      userId, // Creator of the MO
      productId,
      quantity,
      scheduleStartDate,
      deadline,
      assignedToId,
      components, // Array of { componentId, quantity }
      workOrders, // Array of { operation, assignedToId, workCenterId }
      status, // Optional, default to draft
    } = req.body;

    // Construct payload for service
    const moData = {
      id: id,
      createdById: userId,
      productId,
      quantity,
      scheduleStartDate,
      deadline,
      assignedToId,
      components,
      workOrders,
      status: status || "draft",
    };

    // Call service to save the MO draft
    const mo = await saveDraftManufacturingOrderService(moData);

    res.status(201).json({ success: true, data: mo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/mo/dashboard - Dashboard endpoint with filtering and pagination
export const getDashboardMOs = async (req: Request, res: Response) => {
  try {
    const {
      status,
      assignedTo,
      productId,
      dateStart,
      dateEnd,
      search,
      limit = "10",
      offset = "0",
    } = req.query;

    // Parse query parameters
    const filters: any = {};
    
    if (status && typeof status === 'string') {
      filters.status = status as OrderStatus;
    }
    
    if (assignedTo && typeof assignedTo === 'string') {
      filters.assignedTo = parseInt(assignedTo);
    }
    
    if (productId && typeof productId === 'string') {
      filters.productId = parseInt(productId);
    }
    
    if (dateStart && dateEnd && typeof dateStart === 'string' && typeof dateEnd === 'string') {
      filters.dateRange = {
        start: new Date(dateStart),
        end: new Date(dateEnd),
      };
    }
    
    if (search && typeof search === 'string') {
      filters.search = search;
    }
    
    filters.limit = parseInt(limit as string);
    filters.offset = parseInt(offset as string);

    const result = await getDashboardMOsService(filters);

    res.status(200).json({ 
      success: true, 
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/mo/:id - Get single MO with complete details
export const getMOWithDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "MO ID is required" 
      });
    }

    const moId = parseInt(id);

    if (isNaN(moId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid MO ID" 
      });
    }

    const mo = await getMOWithDetailsService(moId);

    res.status(200).json({ success: true, data: mo });
  } catch (error: any) {
    if (error.message === 'Manufacturing Order not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/mo/:id/status - Update MO status
export const updateMOStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId || 1; // Fallback to user ID 1 if not authenticated

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "MO ID is required" 
      });
    }

    const moId = parseInt(id);

    if (isNaN(moId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid MO ID" 
      });
    }

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }

    // Validate status is a valid OrderStatus
    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value" 
      });
    }

    const updatedMO = await updateMOStatusService(moId, status, userId);

    res.status(200).json({ 
      success: true, 
      data: updatedMO,
      message: `Manufacturing Order status updated to ${status}` 
    });
  } catch (error: any) {
    if (error.message === 'Manufacturing Order not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/mo/:id - Delete or cancel MO
export const deleteMO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId || 1; // Fallback to user ID 1 if not authenticated

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "MO ID is required" 
      });
    }

    const moId = parseInt(id);

    if (isNaN(moId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid MO ID" 
      });
    }

    const result = await deleteMOService(moId, userId);

    const statusCode = result.deleted ? 200 : 200; // Both successful operations
    res.status(statusCode).json({ 
      success: true, 
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Manufacturing Order not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/mo/:id/components - Check component availability
export const getComponentAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "MO ID is required" 
      });
    }

    const moId = parseInt(id);

    if (isNaN(moId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid MO ID" 
      });
    }

    const componentAvailability = await getComponentAvailabilityService(moId);

    res.status(200).json({ 
      success: true, 
      data: componentAvailability 
    });
  } catch (error: any) {
    if (error.message === 'Manufacturing Order not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/mo/:id/validate - Validate MO before confirmation
export const validateMO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId || 1; // Fallback to user ID 1 if not authenticated

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "MO ID is required" 
      });
    }

    const moId = parseInt(id);

    if (isNaN(moId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid MO ID" 
      });
    }

    const validationResult = await validateMOService(moId, userId);

    res.status(200).json({ 
      success: true, 
      data: validationResult 
    });
  } catch (error: any) {
    if (error.message === 'Manufacturing Order not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id/bom - Get BOM population data for a product
export const getBOMPopulation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Product ID is required" 
      });
    }

    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid Product ID" 
      });
    }

    const bomData = await getBOMPopulationService(productId);

    res.status(200).json({ 
      success: true, 
      data: bomData 
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Enhanced MO creation with automatic BOM population
export const createManufacturingOrderWithBOM = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      productId, 
      quantity, 
      scheduleStartDate, 
      deadline,
      assignedToId 
    } = req.body;
    
    // Use userId from body, or fallback to authenticated user ID, or default to 1
    const createdById = userId || req.userId || 1;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required"
      });
    }

    const result = await createManufacturingOrderWithBOMService(
      createdById,
      productId,
      quantity,
      scheduleStartDate,
      deadline,
      assignedToId
    );

    res.status(201).json({ 
      success: true, 
      data: result,
      message: `Manufacturing Order created with ${result.workOrdersCreated} work orders from BOM`
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
