import prisma from "../prisma";
import { Role } from "@prisma/client";

// Helper function to validate user role for write operations
const validateCreatePermission = (userRole: Role) => {
  if (userRole !== Role.admin && userRole !== Role.manager) {
    throw new Error("Access denied: Only admin and manager roles can create/modify products");
  }
};

export const getAllProductsService = async () => {
  try {
    const products = await prisma.product.findMany({
      include: {
        stock: true,
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
          orderBy: {
            id: 'asc',
          },
        },
        usedInBOM: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        _count: {
          select: {
            bom: true,
            usedInBOM: true,
            manufacturingOrders: true,
            productLedger: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      status: true,
      message: "Products retrieved successfully",
      data: products,
    };
  } catch (error: any) {
    console.error("Error getting products:", error);
    return {
      status: false,
      message: "Failed to get products",
      error: error.message,
    };
  }
};

export const getProductByIdService = async (id: number) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stock: true,
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
          orderBy: {
            id: 'asc',
          },
        },
        usedInBOM: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        manufacturingOrders: {
          select: {
            id: true,
            quantity: true,
            status: true,
            createdAt: true,
            scheduleStartDate: true,
            deadline: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 MOs
        },
        productLedger: {
          select: {
            id: true,
            movementType: true,
            quantity: true,
            referenceType: true,
            referenceId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20, // Last 20 movements
        },
        moPresets: {
          select: {
            id: true,
            name: true,
            description: true,
            quantity: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            bom: true,
            usedInBOM: true,
            manufacturingOrders: true,
            productLedger: true,
          },
        },
      },
    });

    if (!product) {
      return {
        status: false,
        message: "Product not found",
      };
    }

    return {
      status: true,
      message: "Product retrieved successfully",
      data: product,
    };
  } catch (error: any) {
    console.error("Error getting product:", error);
    return {
      status: false,
      message: "Failed to get product",
      error: error.message,
    };
  }
};

export const createProductService = async (
  data: {
    name: string;
    description?: string;
    unit?: string;
  },
  userRole: Role
) => {
  try {
    validateCreatePermission(userRole);

    // Check if product with same name already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive', // Case-insensitive search
        },
      },
    });

    if (existingProduct) {
      return {
        status: false,
        message: "Product with this name already exists",
      };
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        unit: data.unit || "unit",
      },
      include: {
        stock: true,
        _count: {
          select: {
            bom: true,
            usedInBOM: true,
            manufacturingOrders: true,
            productLedger: true,
          },
        },
      },
    });

    return {
      status: true,
      message: "Product created successfully",
      data: product,
    };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return {
      status: false,
      message: "Failed to create product",
      error: error.message,
    };
  }
};

export const updateProductService = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    unit?: string;
  },
  userRole: Role
) => {
  try {
    validateCreatePermission(userRole);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return {
        status: false,
        message: "Product not found",
      };
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== existingProduct.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive',
          },
          id: {
            not: id, // Exclude current product
          },
        },
      });

      if (duplicateProduct) {
        return {
          status: false,
          message: "Product with this name already exists",
        };
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.unit !== undefined) updateData.unit = data.unit;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        stock: true,
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
        usedInBOM: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        _count: {
          select: {
            bom: true,
            usedInBOM: true,
            manufacturingOrders: true,
            productLedger: true,
          },
        },
      },
    });

    return {
      status: true,
      message: "Product updated successfully",
      data: updatedProduct,
    };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return {
      status: false,
      message: "Failed to update product",
      error: error.message,
    };
  }
};

export const deleteProductService = async (id: number, userRole: Role) => {
  try {
    validateCreatePermission(userRole);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bom: true,
            usedInBOM: true,
            manufacturingOrders: true,
            productLedger: true,
            moPresets: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return {
        status: false,
        message: "Product not found",
      };
    }

    // Check for dependencies
    const dependencies = [];
    if (existingProduct._count.bom > 0) dependencies.push(`${existingProduct._count.bom} BOM entries`);
    if (existingProduct._count.usedInBOM > 0) dependencies.push(`used in ${existingProduct._count.usedInBOM} other BOMs`);
    if (existingProduct._count.manufacturingOrders > 0) dependencies.push(`${existingProduct._count.manufacturingOrders} manufacturing orders`);
    if (existingProduct._count.productLedger > 0) dependencies.push(`${existingProduct._count.productLedger} ledger entries`);
    if (existingProduct._count.moPresets > 0) dependencies.push(`${existingProduct._count.moPresets} MO presets`);

    if (dependencies.length > 0) {
      return {
        status: false,
        message: `Cannot delete product. It has dependencies: ${dependencies.join(', ')}`,
        dependencies: {
          bom: existingProduct._count.bom,
          usedInBOM: existingProduct._count.usedInBOM,
          manufacturingOrders: existingProduct._count.manufacturingOrders,
          productLedger: existingProduct._count.productLedger,
          moPresets: existingProduct._count.moPresets,
        },
      };
    }

    // Delete associated ProductStock if exists (no dependencies)
    await prisma.productStock.deleteMany({
      where: { productId: id },
    });

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });

    return {
      status: true,
      message: "Product deleted successfully",
      data: existingProduct,
    };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return {
      status: false,
      message: "Failed to delete product",
      error: error.message,
    };
  }
};

export const searchProductsService = async (
  searchTerm: string,
  limit = 50
) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        stock: true,
        _count: {
          select: {
            bom: true,
            usedInBOM: true,
            manufacturingOrders: true,
            productLedger: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    return {
      status: true,
      message: "Products search completed",
      data: products,
      searchTerm,
      resultCount: products.length,
    };
  } catch (error: any) {
    console.error("Error searching products:", error);
    return {
      status: false,
      message: "Failed to search products",
      error: error.message,
    };
  }
};

export const getProductsWithLowStockService = async (threshold = 10) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        stock: true,
      },
      where: {
        stock: {
          quantity: {
            lte: threshold,
          },
        },
      },
      orderBy: {
        stock: {
          quantity: 'asc',
        },
      },
    });

    return {
      status: true,
      message: "Low stock products retrieved successfully",
      data: products,
      threshold,
      count: products.length,
    };
  } catch (error: any) {
    console.error("Error getting low stock products:", error);
    return {
      status: false,
      message: "Failed to get low stock products",
      error: error.message,
    };
  }
};