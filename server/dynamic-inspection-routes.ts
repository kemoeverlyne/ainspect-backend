import { Router } from "express";
import { z } from "zod";
import { IStorage } from "./storage";
import { insertDynamicInspectionItemSchema, insertThirdPartyInspectionItemSchema, insertApiIntegrationSchema } from "@shared/schema";

export function createDynamicInspectionRoutes(storage: IStorage) {
  const router = Router();

  // ============================================================================
  // DYNAMIC INSPECTION ITEMS MANAGEMENT
  // ============================================================================

  // Create dynamic inspection item for a specific room
  router.post("/api/dynamic-inspection-items", async (req, res) => {
    try {
      const itemData = insertDynamicInspectionItemSchema.parse(req.body);
      
      // Role-based access control - only inspectors and managers can create items
      const userRole = (req as any).user?.role;
      if (!userRole || !['inspector', 'manager', 'super_admin'].includes(userRole)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const newItem = await storage.createDynamicInspectionItem(itemData);
      res.json(newItem);
    } catch (error) {
      console.error("Error creating dynamic inspection item:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  // Get dynamic inspection items by report ID
  router.get("/api/dynamic-inspection-items/report/:reportId", async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID" });
      }

      const items = await storage.getDynamicInspectionItemsByReportId(reportId);
      
      // Filter data based on user role - inspectors don't see cost estimates
      const userRole = (req as any).user?.role;
      const filteredItems = storage.filterDataByRole(items, userRole);
      
      res.json(filteredItems);
    } catch (error) {
      console.error("Error fetching dynamic inspection items:", error);
      res.status(500).json({ error: "Failed to fetch inspection items" });
    }
  });

  // Get dynamic inspection items by room ID
  router.get("/api/dynamic-inspection-items/report/:reportId/room/:roomId", async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const roomId = req.params.roomId;
      
      if (isNaN(reportId) || !roomId) {
        return res.status(400).json({ error: "Invalid report ID or room ID" });
      }

      const items = await storage.getDynamicInspectionItemsByRoomId(reportId, roomId);
      
      // Filter data based on user role
      const userRole = (req as any).user?.role;
      const filteredItems = storage.filterDataByRole(items, userRole);
      
      res.json(filteredItems);
    } catch (error) {
      console.error("Error fetching room inspection items:", error);
      res.status(500).json({ error: "Failed to fetch room inspection items" });
    }
  });

  // Update dynamic inspection item
  router.put("/api/dynamic-inspection-items/:id", async (req, res) => {
    try {
      const itemId = req.params.id;
      const updateData = req.body;
      
      // Role-based access control
      const userRole = (req as any).user?.role;
      if (!userRole || !['inspector', 'manager', 'super_admin'].includes(userRole)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // Remove cost/contractor fields if user is inspector
      if (userRole === 'inspector') {
        delete updateData.costEstimate;
        delete updateData.contractorType;
        delete updateData.riskScore;
      }

      const updatedItem = await storage.updateDynamicInspectionItem(itemId, updateData);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating dynamic inspection item:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Update failed" });
    }
  });

  // Delete dynamic inspection item
  router.delete("/api/dynamic-inspection-items/:id", async (req, res) => {
    try {
      const itemId = req.params.id;
      
      // Role-based access control
      const userRole = (req as any).user?.role;
      if (!userRole || !['inspector', 'manager', 'super_admin'].includes(userRole)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      await storage.deleteDynamicInspectionItem(itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dynamic inspection item:", error);
      res.status(500).json({ error: "Failed to delete inspection item" });
    }
  });

  // ============================================================================
  // THIRD PARTY INTEGRATION (external_template_a/external_template_b)
  // ============================================================================

  // Get third party inspection items by source
  router.get("/api/third-party-items/:source", async (req, res) => {
    try {
      const source = req.params.source as 'external_template_a' | 'external_template_b';
      
      if (!['external_template_a', 'external_template_b'].includes(source)) {
        return res.status(400).json({ error: "Invalid source. Must be 'external_template_a' or 'external_template_b'" });
      }

      const items = await storage.getThirdPartyInspectionItemsBySource(source);
      res.json(items);
    } catch (error) {
      console.error("Error fetching third party items:", error);
      res.status(500).json({ error: "Failed to fetch third party items" });
    }
  });

  // Get third party inspection items by room type
  router.get("/api/third-party-items/room-type/:roomType", async (req, res) => {
    try {
      const roomType = req.params.roomType;
      const items = await storage.getThirdPartyInspectionItemsByRoomType(roomType);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items by room type:", error);
      res.status(500).json({ error: "Failed to fetch items by room type" });
    }
  });

  // Get third party inspection items by category
  router.get("/api/third-party-items/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const items = await storage.getThirdPartyInspectionItemsByCategory(category);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items by category:", error);
      res.status(500).json({ error: "Failed to fetch items by category" });
    }
  });

  // Sync third party items (admin only)
  router.post("/api/third-party-items/sync/:source", async (req, res) => {
    try {
      const source = req.params.source as 'external_template_a' | 'external_template_b';
      const items = req.body.items;
      
      // Admin only operation
      const userRole = (req as any).user?.role;
      if (!userRole || !['super_admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: "Admin privileges required" });
      }

      if (!['external_template_a', 'external_template_b'].includes(source)) {
        return res.status(400).json({ error: "Invalid source" });
      }

      await storage.syncThirdPartyItems(source, items);
      res.json({ success: true, message: `Synced ${items.length} items from ${source}` });
    } catch (error) {
      console.error("Error syncing third party items:", error);
      res.status(500).json({ error: "Failed to sync third party items" });
    }
  });

  // ============================================================================
  // API INTEGRATIONS MANAGEMENT
  // ============================================================================

  // Get API integrations (admin only)
  router.get("/api/integrations", async (req, res) => {
    try {
      // Admin only
      const userRole = (req as any).user?.role;
      if (!userRole || !['super_admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: "Admin privileges required" });
      }

      const integrations = await storage.getApiIntegrations();
      // Remove sensitive data
      const sanitized = integrations.map(int => ({
        ...int,
        apiKey: int.apiKey ? "***masked***" : null,
        apiSecret: int.apiSecret ? "***masked***" : null
      }));
      
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching API integrations:", error);
      res.status(500).json({ error: "Failed to fetch API integrations" });
    }
  });

  // Create API integration (admin only)
  router.post("/api/integrations", async (req, res) => {
    try {
      // Admin only
      const userRole = (req as any).user?.role;
      if (!userRole || !['super_admin'].includes(userRole)) {
        return res.status(403).json({ error: "Super admin privileges required" });
      }

      const integrationData = insertApiIntegrationSchema.parse(req.body);
      const newIntegration = await storage.createApiIntegration(integrationData);
      
      // Remove sensitive data from response
      const sanitized = {
        ...newIntegration,
        apiKey: "***masked***",
        apiSecret: newIntegration.apiSecret ? "***masked***" : null
      };
      
      res.json(sanitized);
    } catch (error) {
      console.error("Error creating API integration:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  // Update API integration (admin only)
  router.put("/api/integrations/:id", async (req, res) => {
    try {
      // Admin only
      const userRole = (req as any).user?.role;
      if (!userRole || !['super_admin'].includes(userRole)) {
        return res.status(403).json({ error: "Super admin privileges required" });
      }

      const integrationId = req.params.id;
      const updateData = req.body;
      
      const updatedIntegration = await storage.updateApiIntegration(integrationId, updateData);
      
      // Remove sensitive data from response
      const sanitized = {
        ...updatedIntegration,
        apiKey: "***masked***",
        apiSecret: updatedIntegration.apiSecret ? "***masked***" : null
      };
      
      res.json(sanitized);
    } catch (error) {
      console.error("Error updating API integration:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Update failed" });
    }
  });

  // ============================================================================
  // ROLE-BASED ACCESS HELPERS
  // ============================================================================

  // Get user permissions
  router.get("/api/user-permissions", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  return router;
}