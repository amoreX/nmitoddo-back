import prisma from "../prisma";
import { OrderStatus, WorkStatus } from "@prisma/client";

// Dashboard filtering interface
interface DashboardFilters {
  status?: OrderStatus;
  assignedTo?: number;
  productId?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  limit?: number;
  offset?: number;
}

// Dashboard response interface
interface DashboardMO {
  id: number;
  quantity: number | null;
  status: OrderStatus;
  scheduleStartDate: Date | null;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  assignedTo: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  createdBy: {
    id: number;
    name: string | null;
    email: string;
  };
  workOrdersCount: number;
  completedWorkOrdersCount: number;
  progressPercentage: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

// Dashboard KPIs interface
interface DashboardKPIs {
  totalOrders: number;
  ordersCompleted: number;
  ordersInProgress: number;
  ordersDelayed: number;
  ordersPending: number;
  ordersCancelled: number;
  averageCompletionTime: number | null; // in hours
  onTimeDeliveryRate: number; // percentage
}

// Dashboard KPIs service
export const getDashboardKPIsService = async (): Promise<DashboardKPIs> => {
  try {
    // Get total counts by status
    const statusCounts = await prisma.manufacturingOrder.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { status: 'asc' } // Add required orderBy
    });

    // Initialize counters
    let totalOrders = 0;
    let ordersCompleted = 0;
    let ordersInProgress = 0;
    let ordersPending = 0;
    let ordersCancelled = 0;

    // Process status counts
    statusCounts.forEach(({ status, _count }) => {
      totalOrders += _count.status;
      
      switch (status) {
        case 'done':
          ordersCompleted += _count.status;
          break;
        case 'in_progress':
          ordersInProgress += _count.status;
          break;
        case 'draft':
        case 'confirmed':
          ordersPending += _count.status;
          break;
        case 'cancelled':
          ordersCancelled += _count.status;
          break;
      }
    });

    // Get delayed orders (past deadline but not completed)
    const now = new Date();
    const delayedOrders = await prisma.manufacturingOrder.count({
      where: {
        deadline: { lt: now },
        status: { in: ['draft', 'confirmed', 'in_progress'] }
      }
    });

    // Calculate on-time delivery rate
    const completedWithDeadlines = await prisma.manufacturingOrder.count({
      where: {
        status: 'done',
        deadline: { not: null }
      }
    });

    const completedOnTime = await prisma.manufacturingOrder.count({
      where: {
        status: 'done',
        deadline: { not: null },
        updatedAt: { lte: prisma.manufacturingOrder.fields.deadline }
      }
    });

    const onTimeDeliveryRate = completedWithDeadlines > 0 
      ? Math.round((completedOnTime / completedWithDeadlines) * 100) 
      : 100;

    // Calculate average completion time for completed orders
    const completedOrders = await prisma.manufacturingOrder.findMany({
      where: { status: 'done' },
      select: { 
        createdAt: true, 
        updatedAt: true 
      }
    });

    let averageCompletionTime: number | undefined;
    if (completedOrders.length > 0) {
      const totalHours = completedOrders.reduce((sum, order) => {
        const diffMs = order.updatedAt.getTime() - order.createdAt.getTime();
        return sum + (diffMs / (1000 * 60 * 60)); // Convert to hours
      }, 0);
      averageCompletionTime = Math.round(totalHours / completedOrders.length);
    }

    return {
      totalOrders,
      ordersCompleted,
      ordersInProgress,
      ordersDelayed: delayedOrders,
      ordersPending,
      ordersCancelled,
      averageCompletionTime: averageCompletionTime ?? null,
      onTimeDeliveryRate
    };

  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    throw new Error('Failed to fetch dashboard KPIs');
  }
};

export const createManufacturingOrderService = async (
  createdById: number,
  productId?: number,
  productData?: { name: string; description?: string; unit?: string },
  quantity?: number,
  scheduleStartDate?: string,
  deadline?: string
) => {
  let finalProductId = productId;

  // Always create new empty product if no productId is provided
  if (!productId) {
    const newProduct = await prisma.product.create({
      data: {
        name: productData?.name || "",
        description: productData?.description || "",
        unit: productData?.unit || "unit",
      },
    });
    finalProductId = newProduct.id;
  }

  const createData: any = { 
    status: OrderStatus.draft, 
    createdById,
    productId: finalProductId
  };
  
  if (quantity !== undefined) createData.quantity = quantity;
  if (scheduleStartDate) createData.scheduleStartDate = new Date(scheduleStartDate);
  if (deadline) createData.deadline = new Date(deadline);

  const mo = await prisma.manufacturingOrder.create({
    data: createData,
    include: {
      product: {
        include: {
          bom: {
            include: {
              component: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  description: true,
                },
              },
            },
          },
          stock: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      workOrders: {
        include: {
          workCenter: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
  return mo;
};

export const saveDraftManufacturingOrderService = async (
  moData: MODraftInput,
) => {
  // Validate that productId is provided (required for BOM lookup)
  if (!moData.productId) {
    throw new Error("Product ID is required for manufacturing order");
  }

  // Check if product exists and has BOM
  const product = await prisma.product.findUnique({
    where: { id: moData.productId },
    include: {
      bom: {
        include: {
          component: true
        }
      }
    }
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Update product if product data is provided
  if (moData.product) {
    await prisma.product.update({
      where: { id: moData.productId },
      data: {
        ...(moData.product.name !== undefined && { name: moData.product.name }),
        ...(moData.product.description !== undefined && { description: moData.product.description }),
        ...(moData.product.unit !== undefined && { unit: moData.product.unit }),
      },
    });
  }

  // Create or update the manufacturing order
  const mo = await prisma.manufacturingOrder.upsert({
    where: {
      id: moData.id,
    },
    update: {
      createdById: moData.createdById,
      productId: moData.productId,
      quantity: moData.quantity,
      status: "draft",
      ...(moData.scheduleStartDate !== undefined && { scheduleStartDate: moData.scheduleStartDate }),
      ...(moData.deadline !== undefined && { deadline: moData.deadline }),
      ...(moData.assignedToId !== undefined && { assignedToId: moData.assignedToId }),
    },
    create: {
      id: moData.id,
      createdById: moData.createdById,
      productId: moData.productId,
      quantity: moData.quantity,
      status: "draft",
      ...(moData.scheduleStartDate !== undefined && { scheduleStartDate: moData.scheduleStartDate }),
      ...(moData.deadline !== undefined && { deadline: moData.deadline }),
      ...(moData.assignedToId !== undefined && { assignedToId: moData.assignedToId }),
    },
  });

  // Handle BOM updates if provided (only update fields that changed)
  if (moData.bomUpdates && moData.bomUpdates.length > 0) {
    for (const bomUpdate of moData.bomUpdates) {
      // Validate that BOM entry belongs to the correct product
      if (bomUpdate.productId !== moData.productId) {
        throw new Error(`BOM entry ${bomUpdate.id} does not belong to product ${moData.productId}`);
      }

      // Verify BOM entry exists and belongs to the product
      const existingBOM = await prisma.billOfMaterial.findUnique({
        where: { id: bomUpdate.id }
      });

      if (!existingBOM) {
        throw new Error(`BOM entry with ID ${bomUpdate.id} not found`);
      }

      if (existingBOM.productId !== moData.productId) {
        throw new Error(`BOM entry ${bomUpdate.id} belongs to product ${existingBOM.productId}, not ${moData.productId}`);
      }

      const updateData: any = {};
      
      // Only update fields that are provided
      if (bomUpdate.quantity !== undefined) updateData.quantity = bomUpdate.quantity;
      if (bomUpdate.operation !== undefined) updateData.operation = bomUpdate.operation;
      if (bomUpdate.opDurationMins !== undefined) updateData.opDurationMins = bomUpdate.opDurationMins;
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await prisma.billOfMaterial.update({
          where: { id: bomUpdate.id },
          data: updateData,
        });
      }
    }
  }

  // Handle work orders if provided
  if (moData.workOrders && moData.workOrders.length > 0) {
    // Delete existing work orders for this MO
    await prisma.workOrder.deleteMany({
      where: { moId: mo.id }
    });

    // Create new work orders
    for (const woData of moData.workOrders) {
      await prisma.workOrder.create({
        data: {
          moId: mo.id,
          operation: woData.operation,
          status: woData.status || "to_do",
          durationMins: woData.durationMins,
          comments: woData.comments || null,
          workCenterId: woData.workCenterId || null,
          assignedToId: woData.assignedToId || null,
        },
      });
    }
  }

  // Fetch the complete MO with all related data before returning
  const completeMO = await prisma.manufacturingOrder.findUnique({
    where: { id: mo.id },
    include: {
      product: {
        include: {
          bom: {
            include: {
              component: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  description: true,
                },
              },
            },
          },
          stock: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      workOrders: {
        include: {
          workCenter: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return completeMO || mo;
};

interface ComponentInput {
  id?: number; // BOM ID for updates
  componentId: number;
  quantity: number;
  operation?: string;
  opDurationMins?: number;
}

interface BOMUpdateInput {
  id: number; // BOM entry ID (required to identify which BOM entry to update)
  productId: number; // Product ID (required for validation - must match MO's productId)
  quantity?: number; // Only send if quantity changed
  operation?: string; // Only send if operation changed
  opDurationMins?: number; // Only send if duration changed
  // componentId is NOT changeable - that would be creating a new BOM entry
}

interface WorkOrderInput {
  id?: number; // Optional - if provided, update existing; if not, create new
  operation: string;
  status?: WorkStatus;
  comments?: string;
  durationMins: number;
  workCenterId?: number;
  assignedToId?: number;
}

interface MODraftInput {
  id: number;
  createdById: number;
  productId: number; // Made required since we need it for BOM lookup
  product?: { // Product field updates
    name?: string;
    description?: string;
    unit?: string;
  };
  quantity: number;
  scheduleStartDate?: Date;
  deadline?: Date;
  assignedToId?: number;
  bomUpdates?: BOMUpdateInput[]; // Only modified BOM fields (not full objects)
  workOrders?: WorkOrderInput[]; // Full work order objects (MO-specific)
  status: string;
}

// Dashboard service for fetching Manufacturing Orders with filters
export const getDashboardMOsService = async (filters: DashboardFilters) => {
  const {
    status,
    assignedTo,
    productId,
    dateRange,
    search,
    limit = 10,
    offset = 0,
  } = filters;

  // Build where conditions
  const whereConditions: any = {};

  if (status) {
    whereConditions.status = status;
  }

  if (assignedTo) {
    whereConditions.assignedToId = assignedTo;
  }

  if (productId) {
    whereConditions.productId = productId;
  }

  if (dateRange) {
    whereConditions.createdAt = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  // Search functionality - search by MO ID or product name
  if (search) {
    const searchNumber = parseInt(search);
    whereConditions.OR = [
      // Search by MO ID if search term is a number
      ...(isNaN(searchNumber) ? [] : [{ id: searchNumber }]),
      // Search by product name
      {
        product: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  const [manufacturingOrders, totalCount] = await Promise.all([
    prisma.manufacturingOrder.findMany({
      where: whereConditions,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workOrders: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: offset,
      take: limit,
    }),
    prisma.manufacturingOrder.count({ where: whereConditions }),
  ]);

  // Calculate progress for each MO
  const dashboardMOs: DashboardMO[] = manufacturingOrders.map((mo) => {
    const workOrdersCount = mo.workOrders.length;
    const completedWorkOrdersCount = mo.workOrders.filter(
      (wo) => wo.status === WorkStatus.completed
    ).length;
    const progressPercentage = workOrdersCount > 0 
      ? Math.round((completedWorkOrdersCount / workOrdersCount) * 100) 
      : 0;

    // Calculate timestamps based on work orders
    const startedAt = mo.workOrders.some(wo => wo.status !== WorkStatus.to_do) 
      ? mo.updatedAt // Use updatedAt as approximation for started time
      : null;
    
    const completedAt = mo.status === OrderStatus.done ? mo.updatedAt : null;

    return {
      id: mo.id,
      quantity: mo.quantity,
      status: mo.status,
      scheduleStartDate: mo.scheduleStartDate,
      deadline: mo.deadline,
      createdAt: mo.createdAt,
      updatedAt: mo.updatedAt,
      product: mo.product,
      assignedTo: mo.assignedTo,
      createdBy: mo.createdBy,
      workOrdersCount,
      completedWorkOrdersCount,
      progressPercentage,
      startedAt,
      completedAt,
    };
  });

  return {
    data: dashboardMOs,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasNext: offset + limit < totalCount,
      hasPrevious: offset > 0,
    },
  };
};

// Get single MO with detailed information
export const getMOWithDetailsService = async (moId: number) => {
  const mo = await prisma.manufacturingOrder.findUnique({
    where: { id: moId },
    include: {
      product: {
        include: {
          bom: {
            include: {
              component: {
                include: {
                  stock: true,
                },
              },
            },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      workOrders: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          workCenter: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!mo) {
    throw new Error('Manufacturing Order not found');
  }

  // Calculate component availability and requirements
  const componentAvailability = mo.product?.bom.map((bomItem) => {
    const requiredQuantity = (mo.quantity || 0) * bomItem.quantity;
    const availableQuantity = bomItem.component.stock?.quantity || 0;
    const isAvailable = availableQuantity >= requiredQuantity;

    return {
      componentId: bomItem.componentId,
      componentName: bomItem.component.name,
      requiredQuantity,
      availableQuantity,
      isAvailable,
      shortage: isAvailable ? 0 : requiredQuantity - availableQuantity,
      bomOperation: bomItem.operation,
      bomDurationMins: bomItem.opDurationMins,
    };
  }) || [];

  // Calculate completion percentage
  const workOrdersCount = mo.workOrders.length;
  const completedWorkOrdersCount = mo.workOrders.filter(
    (wo) => wo.status === WorkStatus.completed
  ).length;
  const progressPercentage = workOrdersCount > 0 
    ? Math.round((completedWorkOrdersCount / workOrdersCount) * 100) 
    : 0;

  return {
    ...mo,
    componentAvailability,
    progressPercentage,
    workOrdersCount,
    completedWorkOrdersCount,
  };
};

// Update MO status with validation and work order generation
export const updateMOStatusService = async (moId: number, newStatus: OrderStatus, userId: number) => {
  const mo = await prisma.manufacturingOrder.findUnique({
    where: { id: moId },
    include: {
      workOrders: true,
      product: {
        include: {
          bom: true,
        },
      },
    },
  });

  if (!mo) {
    throw new Error('Manufacturing Order not found');
  }

  // Validate status transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.draft]: [OrderStatus.confirmed, OrderStatus.cancelled],
    [OrderStatus.confirmed]: [OrderStatus.in_progress, OrderStatus.cancelled],
    [OrderStatus.in_progress]: [OrderStatus.done, OrderStatus.cancelled],
    [OrderStatus.to_close]: [OrderStatus.done, OrderStatus.cancelled],
    [OrderStatus.done]: [], // Terminal state
    [OrderStatus.cancelled]: [], // Terminal state
  };

  if (!validTransitions[mo.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${mo.status} to ${newStatus}`);
  }

  const updateData: any = {
    status: newStatus,
    updatedAt: new Date(),
  };

  // Handle specific status transitions
  if (newStatus === OrderStatus.in_progress && mo.status === OrderStatus.confirmed) {
    updateData.scheduleStartDate = updateData.scheduleStartDate || new Date();
  }

  if (newStatus === OrderStatus.done) {
    // Validate all work orders are completed
    const incompleteWorkOrders = mo.workOrders.filter(wo => wo.status !== WorkStatus.completed);
    if (incompleteWorkOrders.length > 0) {
      throw new Error('Cannot mark MO as done. Some work orders are not completed.');
    }
  }

  // Use transaction to update MO and potentially create work orders
  const result = await prisma.$transaction(async (tx) => {
    // Update the MO
    const updatedMO = await tx.manufacturingOrder.update({
      where: { id: moId },
      data: updateData,
    });

    // Auto-generate work orders when moving to confirmed
    if (newStatus === OrderStatus.confirmed && mo.status === OrderStatus.draft) {
      if (mo.product?.bom && mo.product.bom.length > 0) {
        const workOrdersToCreate = mo.product.bom.map((bomItem) => ({
          moId: moId,
          operation: bomItem.operation || `Process Component ${bomItem.componentId}`,
          status: WorkStatus.to_do,
          durationMins: bomItem.opDurationMins || 60, // Default to 60 minutes
          comments: `Auto-generated for component ID: ${bomItem.componentId}`,
        }));

        await tx.workOrder.createMany({
          data: workOrdersToCreate,
        });
      }
    }

    return updatedMO;
  });

  return result;
};

// Delete or cancel MO
export const deleteMOService = async (moId: number, userId: number) => {
  const mo = await prisma.manufacturingOrder.findUnique({
    where: { id: moId },
    include: {
      workOrders: true,
    },
  });

  if (!mo) {
    throw new Error('Manufacturing Order not found');
  }

  // Business rules for deletion/cancellation
  if (mo.status === OrderStatus.draft) {
    // Allow deletion of draft MOs - hard delete with cleanup
    await prisma.$transaction(async (tx) => {
      // Delete associated work orders first
      await tx.workOrder.deleteMany({
        where: { moId: moId },
      });

      // Delete the MO
      await tx.manufacturingOrder.delete({
        where: { id: moId },
      });
    });

    return { message: 'Manufacturing Order deleted successfully', deleted: true };
  } else if (mo.status === OrderStatus.confirmed || mo.status === OrderStatus.in_progress) {
    // Allow cancellation - soft update to cancelled status
    const cancelledMO = await prisma.$transaction(async (tx) => {
      // Cancel all associated work orders
      await tx.workOrder.updateMany({
        where: { 
          moId: moId,
          status: { in: [WorkStatus.to_do, WorkStatus.started, WorkStatus.paused] }
        },
        data: { status: WorkStatus.completed }, // Mark as completed to avoid confusion
      });

      // Update MO status to cancelled
      return await tx.manufacturingOrder.update({
        where: { id: moId },
        data: {
          status: OrderStatus.cancelled,
          updatedAt: new Date(),
        },
      });
    });

    return { message: 'Manufacturing Order cancelled successfully', cancelled: true, data: cancelledMO };
  } else {
    throw new Error(`Cannot delete/cancel MO with status: ${mo.status}`);
  }
};

// Component availability interfaces
interface ComponentAvailability {
  componentId: number;
  componentName: string;
  componentDescription: string | null;
  componentUnit: string;
  requiredQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  shortage: number;
  unitCost: number;
  totalCost: number;
  bomOperation: string | null;
  bomDurationMins: number | null;
}

interface ComponentAvailabilityResponse {
  moId: number;
  moQuantity: number;
  productName: string;
  components: ComponentAvailability[];
  totalMaterialCost: number;
  allComponentsAvailable: boolean;
  shortageCount: number;
}

// MO validation interfaces
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface MOValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  canConfirm: boolean;
  validationSummary: {
    componentsValid: boolean;
    workCenterValid: boolean;
    userPermissionsValid: boolean;
  };
}

// BOM population interface
interface BOMComponent {
  componentId: number;
  componentName: string;
  quantity: number;
  operation: string | null;
  opDurationMins: number | null;
  unitCost: number;
}

interface BOMPopulationResult {
  productId: number;
  productName: string;
  components: BOMComponent[];
  operations: string[];
  totalMaterialCost: number;
  estimatedDurationMins: number;
}

// Get component availability for a Manufacturing Order
export const getComponentAvailabilityService = async (moId: number): Promise<ComponentAvailabilityResponse> => {
  const mo = await prisma.manufacturingOrder.findUnique({
    where: { id: moId },
    include: {
      product: {
        include: {
          bom: {
            include: {
              component: {
                include: {
                  stock: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mo) {
    throw new Error('Manufacturing Order not found');
  }

  if (!mo.product) {
    throw new Error('Manufacturing Order has no associated product');
  }

  if (!mo.quantity) {
    throw new Error('Manufacturing Order has no quantity specified');
  }

  // Calculate component requirements
  const components: ComponentAvailability[] = mo.product.bom.map((bomItem) => {
    const requiredQuantity = mo.quantity! * bomItem.quantity;
    const availableQuantity = bomItem.component.stock?.quantity || 0;
    const isAvailable = availableQuantity >= requiredQuantity;
    const shortage = isAvailable ? 0 : requiredQuantity - availableQuantity;
    
    // For now, using a default unit cost of 10. In a real system, this would come from a cost table
    const unitCost = 10; // This should be fetched from a component cost table
    const totalCost = requiredQuantity * unitCost;

    return {
      componentId: bomItem.componentId,
      componentName: bomItem.component.name,
      componentDescription: bomItem.component.description,
      componentUnit: bomItem.component.unit,
      requiredQuantity,
      availableQuantity,
      isAvailable,
      shortage,
      unitCost,
      totalCost,
      bomOperation: bomItem.operation,
      bomDurationMins: bomItem.opDurationMins,
    };
  });

  const totalMaterialCost = components.reduce((sum, comp) => sum + comp.totalCost, 0);
  const allComponentsAvailable = components.every(comp => comp.isAvailable);
  const shortageCount = components.filter(comp => !comp.isAvailable).length;

  return {
    moId: mo.id,
    moQuantity: mo.quantity,
    productName: mo.product.name,
    components,
    totalMaterialCost,
    allComponentsAvailable,
    shortageCount,
  };
};

// Validate Manufacturing Order before confirmation
export const validateMOService = async (moId: number, userId: number): Promise<MOValidationResult> => {
  const mo = await prisma.manufacturingOrder.findUnique({
    where: { id: moId },
    include: {
      product: {
        include: {
          bom: {
            include: {
              component: {
                include: {
                  stock: true,
                },
              },
            },
          },
        },
      },
      assignedTo: true,
      workOrders: {
        include: {
          workCenter: true,
        },
      },
    },
  });

  if (!mo) {
    throw new Error('Manufacturing Order not found');
  }

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Validate components availability
  let componentsValid = true;
  if (mo.product && mo.quantity) {
    for (const bomItem of mo.product.bom) {
      const requiredQuantity = mo.quantity * bomItem.quantity;
      const availableQuantity = bomItem.component.stock?.quantity || 0;
      
      if (availableQuantity < requiredQuantity) {
        componentsValid = false;
        const shortage = requiredQuantity - availableQuantity;
        errors.push({
          field: 'components',
          message: `Insufficient stock for component "${bomItem.component.name}". Required: ${requiredQuantity}, Available: ${availableQuantity}, Shortage: ${shortage}`,
          severity: 'error',
        });
      } else if (availableQuantity < requiredQuantity * 1.1) {
        // Warn if stock level is less than 110% of requirement
        warnings.push({
          field: 'components',
          message: `Low stock warning for component "${bomItem.component.name}". Consider restocking soon.`,
          severity: 'warning',
        });
      }
    }
  } else {
    componentsValid = false;
    errors.push({
      field: 'product',
      message: 'Manufacturing Order must have a product and quantity specified',
      severity: 'error',
    });
  }

  // 2. Validate work center capacity
  let workCenterValid = true;
  const workCenterIds = new Set<number>();
  
  for (const workOrder of mo.workOrders) {
    if (workOrder.workCenterId) {
      workCenterIds.add(workOrder.workCenterId);
    }
  }

  for (const workCenterId of workCenterIds) {
    const workCenter = await prisma.workCenter.findUnique({
      where: { id: workCenterId },
      include: {
        workOrders: {
          where: {
            status: { in: [WorkStatus.to_do, WorkStatus.started] },
          },
        },
      },
    });

    if (!workCenter) {
      workCenterValid = false;
      errors.push({
        field: 'workCenter',
        message: `Work center with ID ${workCenterId} not found`,
        severity: 'error',
      });
    } else {
      // Check if work center has too many active work orders (simple capacity check)
      const activeWorkOrders = workCenter.workOrders.length;
      const maxCapacity = 10; // This should be configurable per work center
      
      if (activeWorkOrders >= maxCapacity) {
        workCenterValid = false;
        errors.push({
          field: 'workCenter',
          message: `Work center "${workCenter.name}" is at capacity. Active work orders: ${activeWorkOrders}/${maxCapacity}`,
          severity: 'error',
        });
      } else if (activeWorkOrders >= maxCapacity * 0.8) {
        warnings.push({
          field: 'workCenter',
          message: `Work center "${workCenter.name}" is nearing capacity. Active work orders: ${activeWorkOrders}/${maxCapacity}`,
          severity: 'warning',
        });
      }
    }
  }

  // 3. Validate assigned user permissions
  let userPermissionsValid = true;
  if (mo.assignedToId) {
    const assignedUser = await prisma.user.findUnique({
      where: { id: mo.assignedToId },
    });

    if (!assignedUser) {
      userPermissionsValid = false;
      errors.push({
        field: 'assignedUser',
        message: 'Assigned user not found',
        severity: 'error',
      });
    } else {
      // Check if user has appropriate role
      if (assignedUser.role === 'user' && mo.product?.bom.length && mo.product.bom.length > 5) {
        warnings.push({
          field: 'assignedUser',
          message: 'Assigned user has basic role but MO has complex BOM. Consider assigning to manager or admin.',
          severity: 'warning',
        });
      }

      // Check if user is already overloaded
      const userActiveMOs = await prisma.manufacturingOrder.count({
        where: {
          assignedToId: mo.assignedToId,
          status: { in: [OrderStatus.confirmed, OrderStatus.in_progress] },
        },
      });

      if (userActiveMOs >= 5) {
        warnings.push({
          field: 'assignedUser',
          message: `Assigned user already has ${userActiveMOs} active MOs. Consider load balancing.`,
          severity: 'warning',
        });
      }
    }
  }

  // 4. Additional validations
  if (!mo.deadline) {
    warnings.push({
      field: 'deadline',
      message: 'No deadline specified for Manufacturing Order',
      severity: 'warning',
    });
  } else if (mo.deadline < new Date()) {
    errors.push({
      field: 'deadline',
      message: 'Deadline is in the past',
      severity: 'error',
    });
  }

  if (!mo.scheduleStartDate) {
    warnings.push({
      field: 'scheduleStartDate',
      message: 'No scheduled start date specified',
      severity: 'warning',
    });
  }

  const isValid = errors.length === 0;
  const canConfirm = isValid && componentsValid && workCenterValid && userPermissionsValid;

  return {
    isValid,
    errors,
    warnings,
    canConfirm,
    validationSummary: {
      componentsValid,
      workCenterValid,
      userPermissionsValid,
    },
  };
};

// Get BOM population data for a product
export const getBOMPopulationService = async (productId: number): Promise<BOMPopulationResult> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      bom: {
        include: {
          component: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const components: BOMComponent[] = product.bom.map((bomItem) => {
    const unitCost = 10; // This should come from a cost table in a real system
    
    return {
      componentId: bomItem.componentId,
      componentName: bomItem.component.name,
      quantity: bomItem.quantity,
      operation: bomItem.operation,
      opDurationMins: bomItem.opDurationMins,
      unitCost,
    };
  });

  const operations = product.bom
    .filter(item => item.operation)
    .map(item => item.operation!)
    .filter((operation, index, arr) => arr.indexOf(operation) === index); // Remove duplicates

  const totalMaterialCost = components.reduce((sum, comp) => sum + (comp.quantity * comp.unitCost), 0);
  const estimatedDurationMins = product.bom.reduce((sum, item) => sum + (item.opDurationMins || 0), 0);

  return {
    productId: product.id,
    productName: product.name,
    components,
    operations,
    totalMaterialCost,
    estimatedDurationMins,
  };
};

// Enhanced MO creation with BOM population
export const createManufacturingOrderWithBOMService = async (
  createdById: number,
  productId?: number,
  productData?: { name: string; description?: string; unit?: string },
  quantity?: number,
  scheduleStartDate?: string,
  deadline?: string,
  assignedToId?: number
) => {
  let finalProductId = productId;

  // Create new product if productData is provided and no productId
  if (!productId && productData) {
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description || null,
        unit: productData.unit || "unit",
      },
    });
    finalProductId = newProduct.id;
  }

  if (!finalProductId) {
    throw new Error('Product ID or product data must be provided');
  }

  // Get BOM data first
  const bomData = await getBOMPopulationService(finalProductId);

  // Create the MO
  const createData: any = {
    status: OrderStatus.draft,
    createdById,
    productId: finalProductId,
    quantity,
  };

  if (scheduleStartDate) createData.scheduleStartDate = new Date(scheduleStartDate);
  if (deadline) createData.deadline = new Date(deadline);
  if (assignedToId) createData.assignedToId = assignedToId;

  const mo = await prisma.$transaction(async (tx) => {
    // Create the Manufacturing Order
    const newMO = await tx.manufacturingOrder.create({
      data: createData,
      include: {
        product: {
          include: {
            bom: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    description: true,
                  },
                },
              },
            },
            stock: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create work orders based on BOM operations
    let workOrdersCreated = 0;
    if (bomData.operations.length > 0) {
      const workOrdersToCreate = bomData.operations.map((operation) => ({
        moId: newMO.id,
        operation,
        status: WorkStatus.to_do,
        durationMins: bomData.estimatedDurationMins / bomData.operations.length, // Distribute duration evenly
        comments: `Auto-generated from BOM for operation: ${operation}`,
      }));

      await tx.workOrder.createMany({
        data: workOrdersToCreate,
      });
      workOrdersCreated = bomData.operations.length;
    }

    // Get the created work orders
    const workOrders = await tx.workOrder.findMany({
      where: { moId: newMO.id },
      include: {
        workCenter: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      ...newMO,
      workOrders,
      workOrdersCreated,
    };
  });

  return mo;
};
