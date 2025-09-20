import prisma from "../prisma";
import { OrderStatus } from "@prisma/client";

// BOM interfaces
interface BOMComponentInput {
  componentId: number;
  quantity: number;
  operation?: string;
  opDurationMins?: number;
}

interface CreateBOMInput {
  productId: number;
  components: BOMComponentInput[];
}

interface UpdateBOMInput {
  components: BOMComponentInput[];
}

interface BOMListFilters {
  productId?: number;
  limit?: number;
  offset?: number;
}

interface BOMWithDetails {
  productId: number;
  product: {
    id: number;
    name: string;
    description: string | null;
    unit: string;
  };
  components: {
    id: number;
    componentId: number;
    component: {
      id: number;
      name: string;
      description: string | null;
      unit: string;
      stock?: {
        quantity: number;
      } | null;
    };
    quantity: number;
    operation: string | null;
    opDurationMins: number | null;
    unitCost: number;
    totalCost: number;
  }[];
  totalMaterialCost: number;
  totalManufacturingTime: number;
  componentCount: number;
}

interface BOMListItem {
  productId: number;
  product: {
    id: number;
    name: string;
    description: string | null;
  };
  componentCount: number;
  totalMaterialCost: number;
  totalManufacturingTime: number;
  lastUpdated: Date;
}

// Create new BOM
export const createBOMService = async (bomData: CreateBOMInput): Promise<BOMWithDetails> => {
  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: bomData.productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if BOM already exists for this product
  const existingBOM = await prisma.billOfMaterial.findFirst({
    where: { productId: bomData.productId },
  });

  if (existingBOM) {
    throw new Error('BOM already exists for this product. Use update endpoint to modify it.');
  }

  // Validate all components exist
  const componentIds = bomData.components.map(c => c.componentId);
  const components = await prisma.product.findMany({
    where: { id: { in: componentIds } },
  });

  if (components.length !== componentIds.length) {
    const foundIds = components.map(c => c.id);
    const missingIds = componentIds.filter(id => !foundIds.includes(id));
    throw new Error(`Components not found: ${missingIds.join(', ')}`);
  }

  // Create BOM with transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create BOM entries
    const bomEntries = await Promise.all(
      bomData.components.map(component => 
        tx.billOfMaterial.create({
          data: {
            productId: bomData.productId,
            componentId: component.componentId,
            quantity: component.quantity,
            operation: component.operation || null,
            opDurationMins: component.opDurationMins || null,
          },
        })
      )
    );

    return bomEntries;
  });

  // Return the created BOM with full details
  return getBOMByProductIdService(bomData.productId);
};

// Get all BOMs with filtering
export const getAllBOMsService = async (filters: BOMListFilters) => {
  const { productId, limit = 50, offset = 0 } = filters;

  const whereConditions: any = {};
  if (productId) {
    whereConditions.productId = productId;
  }

  // Get unique products that have BOMs
  const [bomsData, totalCount] = await Promise.all([
    prisma.billOfMaterial.groupBy({
      by: ['productId'],
      where: whereConditions,
      _count: {
        id: true,
      },
      _sum: {
        opDurationMins: true,
      },
      _max: {
        createdAt: true,
      },
      orderBy: {
        productId: 'asc',
      },
      skip: offset,
      take: limit,
    }),
    prisma.billOfMaterial.groupBy({
      by: ['productId'],
      where: whereConditions,
      _count: {
        id: true,
      },
    }).then(results => results.length),
  ]);

  // Get product details and calculate costs
  const productIds = bomsData.map(bom => bom.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  const bomList: BOMListItem[] = bomsData.map(bomData => {
    const product = products.find(p => p.id === bomData.productId)!;
    const unitCost = 10; // Default unit cost - should come from cost table
    const totalMaterialCost = bomData._count.id * unitCost; // Simplified calculation
    
    return {
      productId: bomData.productId,
      product,
      componentCount: bomData._count.id,
      totalMaterialCost,
      totalManufacturingTime: bomData._sum.opDurationMins || 0,
      lastUpdated: bomData._max.createdAt!,
    };
  });

  return {
    data: bomList,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasNext: offset + limit < totalCount,
      hasPrevious: offset > 0,
    },
  };
};

// Get BOM for specific product
export const getBOMByProductIdService = async (productId: number): Promise<BOMWithDetails> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      bom: {
        include: {
          component: {
            include: {
              stock: {
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (!product.bom || product.bom.length === 0) {
    throw new Error('BOM not found for this product');
  }

  // Calculate costs and details
  const unitCost = 10; // Default unit cost - should come from cost table
  
  const components = product.bom.map(bomItem => ({
    id: bomItem.id,
    componentId: bomItem.componentId,
    component: {
      id: bomItem.component.id,
      name: bomItem.component.name,
      description: bomItem.component.description,
      unit: bomItem.component.unit,
      stock: bomItem.component.stock,
    },
    quantity: bomItem.quantity,
    operation: bomItem.operation,
    opDurationMins: bomItem.opDurationMins,
    unitCost,
    totalCost: bomItem.quantity * unitCost,
  }));

  const totalMaterialCost = components.reduce((sum, comp) => sum + comp.totalCost, 0);
  const totalManufacturingTime = components.reduce((sum, comp) => sum + (comp.opDurationMins || 0), 0);

  return {
    productId: product.id,
    product: {
      id: product.id,
      name: product.name,
      description: product.description,
      unit: product.unit,
    },
    components,
    totalMaterialCost,
    totalManufacturingTime,
    componentCount: components.length,
  };
};

// Update existing BOM
export const updateBOMService = async (productId: number, updateData: UpdateBOMInput): Promise<BOMWithDetails> => {
  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if BOM exists
  const existingBOM = await prisma.billOfMaterial.findFirst({
    where: { productId },
  });

  if (!existingBOM) {
    throw new Error('BOM not found for this product. Use create endpoint to create a new BOM.');
  }

  // Validate all components exist
  const componentIds = updateData.components.map(c => c.componentId);
  const components = await prisma.product.findMany({
    where: { id: { in: componentIds } },
  });

  if (components.length !== componentIds.length) {
    const foundIds = components.map(c => c.id);
    const missingIds = componentIds.filter(id => !foundIds.includes(id));
    throw new Error(`Components not found: ${missingIds.join(', ')}`);
  }

  // Update BOM with transaction (replace all components)
  await prisma.$transaction(async (tx) => {
    // Delete existing BOM entries
    await tx.billOfMaterial.deleteMany({
      where: { productId },
    });

    // Create new BOM entries
    await Promise.all(
      updateData.components.map(component => 
        tx.billOfMaterial.create({
          data: {
            productId,
            componentId: component.componentId,
            quantity: component.quantity,
            operation: component.operation || null,
            opDurationMins: component.opDurationMins || null,
          },
        })
      )
    );
  });

  // Return updated BOM
  return getBOMByProductIdService(productId);
};

// Delete BOM (with validation)
export const deleteBOMService = async (productId: number) => {
  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if BOM exists
  const existingBOM = await prisma.billOfMaterial.findFirst({
    where: { productId },
  });

  if (!existingBOM) {
    throw new Error('BOM not found for this product');
  }

  // Check if BOM is used in any active Manufacturing Orders
  const activeMOs = await prisma.manufacturingOrder.findMany({
    where: {
      productId,
      status: {
        in: [OrderStatus.draft, OrderStatus.confirmed, OrderStatus.in_progress],
      },
    },
  });

  if (activeMOs.length > 0) {
    const moIds = activeMOs.map(mo => mo.id).join(', ');
    throw new Error(`Cannot delete BOM. It is used in active Manufacturing Orders: ${moIds}`);
  }

  // Delete BOM entries
  await prisma.billOfMaterial.deleteMany({
    where: { productId },
  });

  return {
    message: `BOM for product ${product.name} deleted successfully`,
    productId,
    productName: product.name,
    deletedComponents: await prisma.billOfMaterial.count({ where: { productId } }), // Should be 0 after deletion
  };
};

// Check if BOM is used in active MOs (utility function)
export const checkBOMUsageService = async (productId: number) => {
  const activeMOs = await prisma.manufacturingOrder.findMany({
    where: {
      productId,
      status: {
        in: [OrderStatus.draft, OrderStatus.confirmed, OrderStatus.in_progress],
      },
    },
    select: {
      id: true,
      status: true,
      quantity: true,
      createdAt: true,
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    isUsed: activeMOs.length > 0,
    activeMOCount: activeMOs.length,
    activeMOs,
  };
};