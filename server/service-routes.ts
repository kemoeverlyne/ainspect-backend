import { Express, Request, Response } from 'express';
import { authenticateToken } from './auth';
import { storage } from './storage';
import { Service, InsertService, InspectorService, InsertInspectorService, InspectionService, InsertInspectionService } from '../shared/schema';

export function registerServiceRoutes(app: Express) {
  // Get all available services
  app.get('/api/services', authenticateToken, async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServices();
      res.json({ success: true, data: services });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
  });

  // Get services by category
  app.get('/api/services/category/:category', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const services = await storage.getServicesByCategory(category);
      res.json({ success: true, data: services });
    } catch (error) {
      console.error('Error fetching services by category:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
  });

  // Get inspector's service preferences
  app.get('/api/inspector/services', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const inspectorServices = await storage.getInspectorServices(userId);
      res.json({ success: true, data: inspectorServices });
    } catch (error) {
      console.error('Error fetching inspector services:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch inspector services' });
    }
  });

  // Update inspector service preferences
  app.put('/api/inspector/services', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const { services: serviceUpdates } = req.body;
      
      // Update each service preference
      for (const serviceUpdate of serviceUpdates) {
        await storage.updateInspectorService(userId, serviceUpdate);
      }

      res.json({ success: true, message: 'Service preferences updated successfully' });
    } catch (error) {
      console.error('Error updating inspector services:', error);
      res.status(500).json({ success: false, error: 'Failed to update service preferences' });
    }
  });

  // Add services to an inspection
  app.post('/api/inspections/:inspectionId/services', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { inspectionId } = req.params;
      const { services: serviceIds } = req.body;

      const inspectionServices = await storage.addServicesToInspection(inspectionId, serviceIds);
      res.json({ success: true, data: inspectionServices });
    } catch (error) {
      console.error('Error adding services to inspection:', error);
      res.status(500).json({ success: false, error: 'Failed to add services to inspection' });
    }
  });

  // Get services for a specific inspection
  app.get('/api/inspections/:inspectionId/services', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { inspectionId } = req.params;
      const inspectionServices = await storage.getInspectionServices(inspectionId);
      res.json({ success: true, data: inspectionServices });
    } catch (error) {
      console.error('Error fetching inspection services:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch inspection services' });
    }
  });

  // Update service status for an inspection
  app.put('/api/inspections/:inspectionId/services/:serviceId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { inspectionId, serviceId } = req.params;
      const { status, notes } = req.body;

      const updatedService = await storage.updateInspectionServiceStatus(inspectionId, serviceId, status, notes);
      res.json({ success: true, data: updatedService });
    } catch (error) {
      console.error('Error updating inspection service:', error);
      res.status(500).json({ success: false, error: 'Failed to update inspection service' });
    }
  });

  // Remove service from inspection
  app.delete('/api/inspections/:inspectionId/services/:serviceId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { inspectionId, serviceId } = req.params;
      
      await storage.removeServiceFromInspection(inspectionId, serviceId);
      res.json({ success: true, message: 'Service removed from inspection' });
    } catch (error) {
      console.error('Error removing service from inspection:', error);
      res.status(500).json({ success: false, error: 'Failed to remove service from inspection' });
    }
  });

  // Get service recommendations based on property type
  app.get('/api/services/recommendations', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { propertyType, squareFootage, yearBuilt } = req.query;
      
      const recommendations = await storage.getServiceRecommendations({
        propertyType: propertyType as string,
        squareFootage: squareFootage ? parseInt(squareFootage as string) : undefined,
        yearBuilt: yearBuilt ? parseInt(yearBuilt as string) : undefined
      });
      
      res.json({ success: true, data: recommendations });
    } catch (error) {
      console.error('Error fetching service recommendations:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch service recommendations' });
    }
  });
}
