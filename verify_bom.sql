-- Query to show complete BoM structure for all preset products
SELECT 
    pp.name as preset_name,
    p.name as product_name,
    c.name as component_name,
    bom.quantity,
    bom.operation,
    c.unit
FROM "ProductPresets" pp
LEFT JOIN "Product" p ON p.name = pp.name
LEFT JOIN "BillOfMaterial" bom ON bom."productId" = p.id
LEFT JOIN "Product" c ON bom."componentId" = c.id
ORDER BY pp.id, bom.id;