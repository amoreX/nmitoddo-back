import prisma from "../prisma";

export interface FetchAllResult {
  status: boolean;
  message: string;
  data?: {
    users: any[];
    sessions: any[];
    products: any[];
    moPresets: any[];
    billOfMaterials: any[];
    manufacturingOrders: any[];
    workOrders: any[];
    workCenters: any[];
    productLedgers: any[];
    productStocks: any[];
    reports: any[];
  };
}

export const fetchAllData = async (): Promise<FetchAllResult> => {
  try {
    // Fetch data from all tables
    const [
      users,
      sessions,
      products,
      moPresets,
      billOfMaterials,
      manufacturingOrders,
      workOrders,
      workCenters,
      productLedgers,
      productStocks,
      reports,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          loginId: true,
          // password: true, // Added for testing
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.session.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
        },
      }),
      prisma.product.findMany({
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
      }),
      // MOPresets with related product and BoM data
      prisma.mOPresets.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
                orderBy: {
                  id: 'asc',
                },
              },
              stock: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.billOfMaterial.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
          component: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      }),
      prisma.manufacturingOrder.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      }),
      prisma.workOrder.findMany({
        include: {
          mo: {
            select: {
              id: true,
              status: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          workCenter: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
        },
      }),
      prisma.workCenter.findMany({
        include: {
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      }),
      prisma.productLedger.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100, // Limit to last 100 entries for performance
      }),
      prisma.productStock.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      }),
      prisma.report.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
        },
        orderBy: {
          generatedAt: 'desc',
        },
        take: 50, // Limit to last 50 reports for performance
      }),
    ]);

    return {
      status: true,
      message: "All data fetched successfully",
      data: {
        users,
        sessions,
        products,
        moPresets,
        billOfMaterials,
        manufacturingOrders,
        workOrders,
        workCenters,
        productLedgers,
        productStocks,
        reports,
      },
    };
  } catch (error: any) {
    console.error("Error fetching all data:", error);
    return {
      status: false,
      message: "Failed to fetch data",
    };
  }
};

export const fetchTableData = async (tableName: string): Promise<any> => {
  try {
    let data;

    switch (tableName.toLowerCase()) {
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            loginId: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        break;

      case 'sessions':
        data = await prisma.session.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                loginId: true,
              },
            },
          },
        });
        break;

      case 'products':
        data = await prisma.product.findMany({
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
        break;

      case 'mopresets':
        data = await prisma.mOPresets.findMany({
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
                  orderBy: {
                    id: 'asc',
                  },
                },
                stock: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        break;

      case 'billofmaterials':
        data = await prisma.billOfMaterial.findMany({
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
            component: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        });
        break;

      case 'manufacturingorders':
        data = await prisma.manufacturingOrder.findMany({
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                loginId: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                loginId: true,
              },
            },
            _count: {
              select: {
                workOrders: true,
              },
            },
          },
        });
        break;

      case 'workorders':
        data = await prisma.workOrder.findMany({
          include: {
            mo: {
              select: {
                id: true,
                status: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            workCenter: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                loginId: true,
              },
            },
          },
        });
        break;

      case 'workcenters':
        data = await prisma.workCenter.findMany({
          include: {
            _count: {
              select: {
                workOrders: true,
              },
            },
          },
        });
        break;

      case 'productledgers':
        data = await prisma.productLedger.findMany({
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        break;

      case 'productstocks':
        data = await prisma.productStock.findMany({
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        });
        break;

      case 'reports':
        data = await prisma.report.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                loginId: true,
              },
            },
          },
          orderBy: {
            generatedAt: 'desc',
          },
        });
        break;

      default:
        throw new Error(`Table '${tableName}' not found`);
    }

    return {
      status: true,
      message: `${tableName} data fetched successfully`,
      data,
    };
  } catch (error: any) {
    console.error(`Error fetching ${tableName} data:`, error);
    return {
      status: false,
      message: `Failed to fetch ${tableName} data: ${error.message}`,
    };
  }
};
