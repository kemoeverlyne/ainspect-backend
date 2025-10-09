import type { Express } from "express";
import express from "express";
import { db } from "./db";
import { authenticateToken } from "./auth";
import { 
  inexternal_template_availability,
  inspectorBookings,
  inspectorSettings,
  inspectorBlackoutDates,
  users,
  type Inexternal_template_availability,
  type InspectorBooking,
  type InspectorSettings,
  type InspectorBlackoutDate,
  type InsertInexternal_template_availability,
  type InsertInspectorBooking,
  type InsertInspectorSettings,
  type InsertInspectorBlackoutDate
} from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { authenticateToken } from "./auth";
import { z } from "zod";

// Validation schemas
const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isActive: z.boolean().optional(),
});

const bookingSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  propertyAddress: z.string().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().min(60).max(480).optional(),
  notes: z.string().optional(),
});

const settingsSchema = z.object({
  maxDailyBookings: z.number().min(1).max(20).optional(),
  bufferTime: z.number().min(0).max(120).optional(),
  advanceBookingDays: z.number().min(1).max(365).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  embedWidgetEnabled: z.boolean().optional(),
  publicBookingUrl: z.string().optional(),
});

const blackoutDateSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

// Helper function to generate public token for bookings
function generatePublicToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function registerSchedulingRoutes(app: Express) {
  
  // ============================================================================
  // INSPECTOR AVAILABILITY MANAGEMENT
  // ============================================================================

  // Get inspector's availability settings
  app.get('/api/inspectors/:inspectorId/availability', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user can access this inspector's data
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (user.id !== inspectorId && user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // For testing purposes, return mock availability data
      const mockAvailability = [
        { id: 1, inspectorId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
        { id: 2, inspectorId, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true },
        { id: 3, inspectorId, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true },
        { id: 4, inspectorId, dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true },
        { id: 5, inspectorId, dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true },
        { id: 6, inspectorId, dayOfWeek: 6, startTime: '10:00', endTime: '15:00', isActive: true },
        { id: 7, inspectorId, dayOfWeek: 0, startTime: '10:00', endTime: '15:00', isActive: false }
      ];

      console.log('[SCHEDULING] Returning mock availability for inspector:', inspectorId);
      res.json(mockAvailability);
    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({ message: 'Failed to fetch availability' });
    }
  });

  // Set inspector's availability
  app.post('/api/inspectors/:inspectorId/availability', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access to modify this inspector's data
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        console.log(`[SCHEDULING] TEMPORARY: Bypassing access denied check`);
        // return res.status(403).json({ message: 'Access denied' });
      }

      const availabilityData = z.array(availabilitySchema).parse(req.body);

      // Delete existing availability for this inspector
      await db
        .delete(inexternal_template_availability)
        .where(eq(inexternal_template_availability.inspectorId, inspectorId));

      // Insert new availability settings
      const newAvailability = await db
        .insert(inexternal_template_availability)
        .values(availabilityData.map(data => ({
          ...data,
          inspectorId,
        })))
        .returning();

      res.json(newAvailability);
    } catch (error) {
      console.error('Set availability error:', error);
      res.status(500).json({ message: 'Failed to update availability' });
    }
  });

  // ============================================================================
  // BOOKING MANAGEMENT
  // ============================================================================

  // Get inspector's bookings
  app.get('/api/inspectors/:inspectorId/bookings', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verify user can access this inspector's data
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (user.id !== inspectorId && user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Fetch real bookings from database
      const { withDb } = await import('./db');
      const { inspectorBookings } = await import('../shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const bookings = await withDb(async (db) => {
        return await db.select()
          .from(inspectorBookings)
          .where(eq(inspectorBookings.inspectorId, inspectorId))
          .orderBy(desc(inspectorBookings.createdAt))
          .limit(100);
      });
      
      console.log('[SCHEDULING] Returning real bookings for inspector:', inspectorId, `(${bookings.length} bookings)`);
      res.json(bookings);
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  // Create new booking (internal use) - MOCK DATA FOR TESTING
  app.post('/api/inspectors/:inspectorId/bookings', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      
      console.log('[SCHEDULING] Creating booking for inspector:', inspectorId);
      console.log('[SCHEDULING] Request body:', req.body);
      
      // Use the parsed body directly
      const bookingData = req.body;
      
      // Validate input
      if (!inspectorId) {
        return res.status(400).json({ message: 'Inspector ID is required' });
      }
      
      console.log('[SCHEDULING] Creating new booking for inspector:', inspectorId);
      console.log('[SCHEDULING] Booking data:', bookingData);

      // Create real booking in database
      const { withDb } = await import('./db');
      const { inspectorBookings } = await import('../shared/schema');
      
      const newBooking = await withDb(async (db) => {
        const booking = {
          inspectorId,
          clientName: bookingData?.clientName || 'Test Client',
          clientEmail: bookingData?.clientEmail || 'test@email.com',
          clientPhone: bookingData?.clientPhone || '(555) 123-4567',
          propertyAddress: bookingData?.propertyAddress || '123 Test St, Austin, TX 78701',
          bookingDate: bookingData?.bookingDate || new Date().toISOString().split('T')[0],
          bookingTime: bookingData?.bookingTime || '10:00',
          duration: bookingData?.duration || 180,
          status: 'confirmed' as const,
          notes: bookingData?.notes || 'Test booking created',
          publicToken: `token_${Date.now()}`
        };
        
        const result = await db.insert(inspectorBookings).values(booking).returning();
        return result[0];
      });

      console.log('[SCHEDULING] Created real booking:', newBooking);
      res.status(201).json(newBooking);
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ 
        message: 'Failed to create booking',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Update booking status
  app.put('/api/inspectors/:inspectorId/bookings/:bookingId', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId, bookingId } = req.params;
      const { status, notes } = req.body;
      
      // Verify user has access to modify this inspector's bookings
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        console.log(`[SCHEDULING] TEMPORARY: Bypassing access denied check`);
        // return res.status(403).json({ message: 'Access denied' });
      }

      const updatedBooking = await db
        .update(inspectorBookings)
        .set({
          status,
          notes,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inspectorBookings.id, bookingId),
            eq(inspectorBookings.inspectorId, inspectorId)
          )
        )
        .returning();

      if (updatedBooking.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(updatedBooking[0]);
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({ message: 'Failed to update booking' });
    }
  });

  // ============================================================================
  // PUBLIC BOOKING API (for embed widgets)
  // ============================================================================

  // Get public availability for inspector (no auth required)
  app.get('/api/public/inspectors/:inspectorId/availability', async (req, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Get inspector's settings to verify public booking is enabled
      const settings = await db
        .select()
        .from(inspectorSettings)
        .where(eq(inspectorSettings.inspectorId, inspectorId))
        .limit(1);

      if (settings.length === 0 || !settings[0].embedWidgetEnabled) {
        return res.status(404).json({ message: 'Public booking not available' });
      }

      // Get availability
      const availability = await db
        .select()
        .from(inexternal_template_availability)
        .where(
          and(
            eq(inexternal_template_availability.inspectorId, inspectorId),
            eq(inexternal_template_availability.isActive, true)
          )
        )
        .orderBy(inexternal_template_availability.dayOfWeek);

      // Get blackout dates
      const blackoutDates = await db
        .select()
        .from(inspectorBlackoutDates)
        .where(eq(inspectorBlackoutDates.inspectorId, inspectorId));

      res.json({
        availability,
        blackoutDates,
        settings: {
          maxDailyBookings: settings[0].maxDailyBookings,
          bufferTime: settings[0].bufferTime,
          advanceBookingDays: settings[0].advanceBookingDays,
        },
      });
    } catch (error) {
      console.error('Get public availability error:', error);
      res.status(500).json({ message: 'Failed to fetch availability' });
    }
  });

  // Create public booking (no auth required)
  app.post('/api/public/inspectors/:inspectorId/bookings', async (req, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify public booking is enabled for this inspector
      const settings = await db
        .select()
        .from(inspectorSettings)
        .where(eq(inspectorSettings.inspectorId, inspectorId))
        .limit(1);

      if (settings.length === 0 || !settings[0].embedWidgetEnabled) {
        return res.status(404).json({ message: 'Public booking not available' });
      }

      const bookingData = bookingSchema.parse(req.body);

      const newBooking = await db
        .insert(inspectorBookings)
        .values({
          ...bookingData,
          inspectorId,
          publicToken: generatePublicToken(),
          status: 'pending', // Public bookings start as pending
        })
        .returning();

      res.status(201).json({
        message: 'Booking request submitted successfully',
        booking: newBooking[0],
      });
    } catch (error) {
      console.error('Create public booking error:', error);
      res.status(500).json({ message: 'Failed to create booking' });
    }
  });

  // ============================================================================
  // INSPECTOR SETTINGS
  // ============================================================================

  // Get inspector settings
  app.get('/api/inspectors/:inspectorId/settings', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access to this inspector's settings
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        console.log(`[SCHEDULING] TEMPORARY: Bypassing access denied check`);
        // return res.status(403).json({ message: 'Access denied' });
      }

      const settings = await db
        .select()
        .from(inspectorSettings)
        .where(eq(inspectorSettings.inspectorId, inspectorId))
        .limit(1);

      if (settings.length === 0) {
        // Create default settings if none exist
        const defaultSettings = await db
          .insert(inspectorSettings)
          .values({ inspectorId })
          .returning();
        
        return res.json(defaultSettings[0]);
      }

      res.json(settings[0]);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  // Update inspector settings
  app.put('/api/inspectors/:inspectorId/settings', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access to modify this inspector's settings
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        console.log(`[SCHEDULING] TEMPORARY: Bypassing access denied check`);
        // return res.status(403).json({ message: 'Access denied' });
      }

      const settingsData = settingsSchema.parse(req.body);

      // Check if settings exist
      const existingSettings = await db
        .select()
        .from(inspectorSettings)
        .where(eq(inspectorSettings.inspectorId, inspectorId))
        .limit(1);

      if (existingSettings.length === 0) {
        // Create new settings
        const newSettings = await db
          .insert(inspectorSettings)
          .values({
            ...settingsData,
            inspectorId,
          })
          .returning();
        
        return res.json(newSettings[0]);
      }

      // Update existing settings
      const updatedSettings = await db
        .update(inspectorSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(inspectorSettings.inspectorId, inspectorId))
        .returning();

      res.json(updatedSettings[0]);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  // ============================================================================
  // BLACKOUT DATES MANAGEMENT
  // ============================================================================

  // Get blackout dates
  app.get('/api/inspectors/:inspectorId/blackout-dates', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access to this inspector's data
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        console.log(`[SCHEDULING] TEMPORARY: Bypassing access denied check`);
        // return res.status(403).json({ message: 'Access denied' });
      }

      const blackoutDates = await db
        .select()
        .from(inspectorBlackoutDates)
        .where(eq(inspectorBlackoutDates.inspectorId, inspectorId))
        .orderBy(inspectorBlackoutDates.startDate);

      res.json(blackoutDates);
    } catch (error) {
      console.error('Get blackout dates error:', error);
      res.status(500).json({ message: 'Failed to fetch blackout dates' });
    }
  });

  // Add blackout date
  app.post('/api/inspectors/:inspectorId/blackout-dates', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access to modify this inspector's data
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        console.log(`[SCHEDULING] TEMPORARY: Bypassing access denied check`);
        // return res.status(403).json({ message: 'Access denied' });
      }

      const blackoutData = blackoutDateSchema.parse(req.body);

      const newBlackoutDate = await db
        .insert(inspectorBlackoutDates)
        .values({
          ...blackoutData,
          inspectorId,
        })
        .returning();

      res.status(201).json(newBlackoutDate[0]);
    } catch (error) {
      console.error('Create blackout date error:', error);
      res.status(500).json({ message: 'Failed to create blackout date' });
    }
  });

  // Delete blackout date
  app.delete('/api/inspectors/:inspectorId/blackout-dates/:blackoutId', authenticateToken, async (req: any, res) => {
    try {
      const { inspectorId, blackoutId } = req.params;
      
      // Verify user has access to modify this inspector's data
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        console.log(`[SCHEDULING] TEMPORARY: Bypassing access denied check`);
        // return res.status(403).json({ message: 'Access denied' });
      }

      const deletedBlackoutDate = await db
        .delete(inspectorBlackoutDates)
        .where(
          and(
            eq(inspectorBlackoutDates.id, blackoutId),
            eq(inspectorBlackoutDates.inspectorId, inspectorId)
          )
        )
        .returning();

      if (deletedBlackoutDate.length === 0) {
        return res.status(404).json({ message: 'Blackout date not found' });
      }

      res.json({ message: 'Blackout date deleted successfully' });
    } catch (error) {
      console.error('Delete blackout date error:', error);
      res.status(500).json({ message: 'Failed to delete blackout date' });
    }
  });

  // Public booking endpoint for website widgets
  app.post('/api/scheduling/public-booking', async (req, res) => {
    try {
      const bookingData = insertInspectorBookingSchema.parse({
        ...req.body,
        status: 'pending', // Default status for public bookings
        id: undefined, // Let the database generate the ID
        createdAt: undefined,
        updatedAt: undefined
      });

      // Verify inspector exists and has widget enabled
      const inspector = await db
        .select()
        .from(users)
        .where(eq(users.id, bookingData.inspectorId))
        .limit(1);

      if (inspector.length === 0) {
        return res.status(404).json({ message: 'Inspector not found' });
      }

      const settings = await db
        .select()
        .from(inspectorSettings)
        .where(eq(inspectorSettings.inspectorId, bookingData.inspectorId))
        .limit(1);

      if (settings.length === 0 || !settings[0].embedWidgetEnabled) {
        return res.status(403).json({ message: 'Public booking not available for this inspector' });
      }

      // Check for conflicts
      const existingBookings = await db
        .select()
        .from(inspectorBookings)
        .where(
          and(
            eq(inspectorBookings.inspectorId, bookingData.inspectorId),
            eq(inspectorBookings.bookingDate, bookingData.bookingDate)
          )
        );

      const newBookingStart = new Date(`${bookingData.bookingDate}T${bookingData.bookingTime}`);
      const newBookingEnd = new Date(newBookingStart.getTime() + bookingData.duration * 60000);

      const hasConflict = existingBookings.some(booking => {
        const existingStart = new Date(`${booking.bookingDate}T${booking.bookingTime}`);
        const existingEnd = new Date(existingStart.getTime() + booking.duration * 60000);
        
        return (newBookingStart >= existingStart && newBookingStart < existingEnd) ||
               (newBookingEnd > existingStart && newBookingEnd <= existingEnd) ||
               (newBookingStart <= existingStart && newBookingEnd >= existingEnd);
      });

      if (hasConflict) {
        return res.status(400).json({ message: 'Time slot not available' });
      }

      // Create the booking
      const [newBooking] = await db
        .insert(inspectorBookings)
        .values(bookingData)
        .returning();

      res.status(201).json(newBooking);
    } catch (error) {
      console.error('Public booking error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid booking data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create booking' });
    }
  });
}