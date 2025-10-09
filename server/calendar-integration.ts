import type { Express, Request, Response } from "express";
import { google } from 'googleapis';
import { db } from "./db";
import { 
  inspectorSettings,
  inspectorBookings,
  users,
  type InspectorSettings,
  type InspectorBooking
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { authenticateToken } from "./auth";
import ical, { ICalEventStatus } from 'ical-generator';
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    name?: string;
  };
}

// Google Calendar OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/google/callback';

// Validation schemas
const googleAuthSchema = z.object({
  inspectorId: z.string(),
  code: z.string(),
});

const calendarEventSchema = z.object({
  bookingId: z.string(),
  action: z.enum(['create', 'update', 'delete']),
});

// Helper function to get Google OAuth2 client
function getGoogleOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar credentials not configured');
  }
  
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

// Helper function to get authenticated calendar client
async function getCalendarClient(inspectorId: string) {
  const settings = await db
    .select()
    .from(inspectorSettings)
    .where(eq(inspectorSettings.inspectorId, inspectorId))
    .limit(1);

  if (settings.length === 0 || !settings[0].googleAccessToken) {
    throw new Error('Google Calendar not connected for this inspector');
  }

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: settings[0].googleAccessToken,
    refresh_token: settings[0].googleRefreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  return { calendar, settings: settings[0] };
}

// Helper function to create calendar event from booking
function createCalendarEvent(booking: InspectorBooking, inspector: any) {
  const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingTime}`);
  const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60000);

  return {
    summary: `Home Inspection - ${booking.clientName}`,
    description: `
Property Address: ${booking.propertyAddress}
Client: ${booking.clientName}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || 'Not provided'}
Duration: ${booking.duration} minutes
Notes: ${booking.notes || 'No notes'}

Inspector: ${inspector.name || inspector.email}
`.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/New_York', // TODO: Make this configurable
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/New_York',
    },
    location: booking.propertyAddress,
    attendees: [
      { email: booking.clientEmail, displayName: booking.clientName },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };
}

export function registerCalendarIntegrationRoutes(app: Express) {
  
  // ============================================================================
  // GOOGLE CALENDAR INTEGRATION
  // ============================================================================

  // Get Google Calendar authorization URL
  app.get('/api/calendar/google/auth-url/:inspectorId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const oauth2Client = getGoogleOAuth2Client();
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        state: inspectorId, // Pass inspector ID in state
        prompt: 'consent', // Force consent to get refresh token
      });

      res.json({ authUrl });
    } catch (error) {
      console.error('Google auth URL error:', error);
      res.status(500).json({ message: 'Failed to generate authorization URL' });
    }
  });

  // Handle Google Calendar OAuth callback
  app.get('/api/calendar/google/callback', async (req, res) => {
    try {
      const { code, state: inspectorId } = req.query;

      if (!code || !inspectorId) {
        return res.status(400).send('Missing authorization code or inspector ID');
      }

      const oauth2Client = getGoogleOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code as string);

      if (!tokens.access_token) {
        return res.status(400).send('Failed to get access token');
      }

      // Get user's primary calendar ID
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarList = await calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);

      // Update inspector settings with Google Calendar tokens
      await db
        .update(inspectorSettings)
        .set({
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleCalendarId: primaryCalendar?.id || 'primary',
          updatedAt: new Date(),
        })
        .where(eq(inspectorSettings.inspectorId, inspectorId as string));

      // Redirect to success page
      res.redirect(`/dashboard?calendar=connected`);
    } catch (error) {
      console.error('Google Calendar callback error:', error);
      res.status(500).send('Failed to connect Google Calendar');
    }
  });

  // Disconnect Google Calendar
  app.post('/api/calendar/google/disconnect/:inspectorId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Clear Google Calendar credentials
      await db
        .update(inspectorSettings)
        .set({
          googleAccessToken: null,
          googleRefreshToken: null,
          googleCalendarId: null,
          updatedAt: new Date(),
        })
        .where(eq(inspectorSettings.inspectorId, inspectorId));

      res.json({ message: 'Google Calendar disconnected successfully' });
    } catch (error) {
      console.error('Google Calendar disconnect error:', error);
      res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
    }
  });

  // Sync booking to Google Calendar
  app.post('/api/calendar/google/sync', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId, action } = calendarEventSchema.parse(req.body);

      // Get booking details
      const booking = await db
        .select()
        .from(inspectorBookings)
        .where(eq(inspectorBookings.id, bookingId))
        .limit(1);

      if (booking.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const bookingData = booking[0];
      
      // Verify user has access
      if (req.user?.id !== bookingData.inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get inspector details
      const inspector = await db
        .select()
        .from(users)
        .where(eq(users.id, bookingData.inspectorId))
        .limit(1);

      if (inspector.length === 0) {
        return res.status(404).json({ message: 'Inspector not found' });
      }

      const { calendar, settings } = await getCalendarClient(bookingData.inspectorId);

      let result;
      if (action === 'create') {
        const event = createCalendarEvent(bookingData, inspector[0]);
        const response = await calendar.events.insert({
          calendarId: settings.googleCalendarId || 'primary',
          requestBody: event,
        });

        // Update booking with Google event ID
        await db
          .update(inspectorBookings)
          .set({
            googleEventId: response.data.id,
            updatedAt: new Date(),
          })
          .where(eq(inspectorBookings.id, bookingId));

        result = { eventId: response.data.id, action: 'created' };
      } else if (action === 'update' && bookingData.googleEventId) {
        const event = createCalendarEvent(bookingData, inspector[0]);
        await calendar.events.update({
          calendarId: settings.googleCalendarId || 'primary',
          eventId: bookingData.googleEventId,
          requestBody: event,
        });
        result = { eventId: bookingData.googleEventId, action: 'updated' };
      } else if (action === 'delete' && bookingData.googleEventId) {
        await calendar.events.delete({
          calendarId: settings.googleCalendarId || 'primary',
          eventId: bookingData.googleEventId,
        });

        // Clear Google event ID from booking
        await db
          .update(inspectorBookings)
          .set({
            googleEventId: null,
            updatedAt: new Date(),
          })
          .where(eq(inspectorBookings.id, bookingId));

        result = { eventId: bookingData.googleEventId, action: 'deleted' };
      }

      res.json(result);
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      res.status(500).json({ message: 'Failed to sync with Google Calendar' });
    }
  });

  // ============================================================================
  // CALENDAR EXPORT (ICS FORMAT)
  // ============================================================================

  // Export inspector's calendar as ICS file
  app.get('/api/calendar/export/:inspectorId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { inspectorId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verify user has access
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get inspector details
      const inspector = await db
        .select()
        .from(users)
        .where(eq(users.id, inspectorId))
        .limit(1);

      if (inspector.length === 0) {
        return res.status(404).json({ message: 'Inspector not found' });
      }

      // Get bookings
      let whereCondition = eq(inspectorBookings.inspectorId, inspectorId);
      if (startDate && endDate) {
        whereCondition = and(
          eq(inspectorBookings.inspectorId, inspectorId),
          gte(inspectorBookings.bookingDate, startDate as string),
          lte(inspectorBookings.bookingDate, endDate as string)
        );
      }

      const bookings = await db
        .select()
        .from(inspectorBookings)
        .where(whereCondition);

      // Create ICS calendar
      const cal = ical({
        name: `${inspector[0].name || inspector[0].email} - Inspection Calendar`,
        description: 'Home inspection appointments',
        timezone: 'America/New_York',
      });

      // Add events
      bookings.forEach(booking => {
        const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingTime}`);
        const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60000);

        cal.createEvent({
          start: startDateTime,
          end: endDateTime,
          summary: `Home Inspection - ${booking.clientName}`,
          description: `
Property: ${booking.propertyAddress}
Client: ${booking.clientName}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || 'Not provided'}
Notes: ${booking.notes || 'No notes'}
          `.trim(),
          location: booking.propertyAddress,
          uid: `booking-${booking.id}@ainspect.com`,
          status: booking.status === 'confirmed' ? ICalEventStatus.CONFIRMED : ICalEventStatus.TENTATIVE,
        });
      });

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="inspection-calendar-${inspectorId}.ics"`);
      
      res.send(cal.toString());
    } catch (error) {
      console.error('Calendar export error:', error);
      res.status(500).json({ message: 'Failed to export calendar' });
    }
  });

  // ============================================================================
  // PUBLIC BOOKING WIDGET
  // ============================================================================

  // Get public booking widget HTML
  app.get('/api/calendar/widget/:inspectorId', async (req, res) => {
    try {
      const { inspectorId } = req.params;
      
      // Get inspector details and settings
      const inspector = await db
        .select()
        .from(users)
        .where(eq(users.id, inspectorId))
        .limit(1);

      if (inspector.length === 0) {
        return res.status(404).json({ message: 'Inspector not found' });
      }

      const settings = await db
        .select()
        .from(inspectorSettings)
        .where(eq(inspectorSettings.inspectorId, inspectorId))
        .limit(1);

      if (settings.length === 0 || !settings[0].embedWidgetEnabled) {
        return res.status(404).json({ message: 'Booking widget not available' });
      }

      // Generate widget HTML
      const baseUrl = req.get('host');
      const protocol = req.secure ? 'https' : 'http';
      
      const widgetHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Home Inspection - ${inspector[0].name || 'Inspector'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
        .widget { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 8px 0 0; opacity: 0.9; }
        .content { padding: 24px; }
        .book-button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 16px; }
        .book-button:hover { background: #2563eb; }
        .info { background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        .info h3 { margin: 0 0 8px; color: #374151; }
        .info p { margin: 0; color: #6b7280; }
    </style>
</head>
<body>
    <div class="widget">
        <div class="header">
            <h1>Book Your Home Inspection</h1>
            <p>Schedule with ${inspector[0].name || 'Professional Inspector'}</p>
        </div>
        <div class="content">
            <div class="info">
                <h3>What to Expect</h3>
                <p>Comprehensive home inspection with detailed report and AI-powered analysis. Typical inspection takes ${settings[0].maxDailyBookings * 2} hours.</p>
            </div>
            <button class="book-button" onclick="openBookingForm()">
                Schedule Your Inspection
            </button>
        </div>
    </div>

    <script>
        function openBookingForm() {
            const url = '${protocol}://${baseUrl}/calendar/public-booking/${inspectorId}';
            window.open(url, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
        }
    </script>
</body>
</html>
      `.trim();

      res.setHeader('Content-Type', 'text/html');
      res.send(widgetHtml);
    } catch (error) {
      console.error('Widget generation error:', error);
      res.status(500).json({ message: 'Failed to generate booking widget' });
    }
  });

  // Get widget embed code
  app.get('/api/calendar/widget-code/:inspectorId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { inspectorId } = req.params;
      
      // Verify user has access
      if (req.user?.id !== inspectorId && req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const baseUrl = req.get('host');
      const protocol = req.secure ? 'https' : 'http';
      
      const iframeCode = `<iframe src="${protocol}://${baseUrl}/api/calendar/widget/${inspectorId}" width="600" height="500" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>`;
      
      const linkCode = `<a href="${protocol}://${baseUrl}/api/calendar/widget/${inspectorId}" target="_blank" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Book Home Inspection</a>`;

      res.json({
        iframeCode,
        linkCode,
        directUrl: `${protocol}://${baseUrl}/api/calendar/widget/${inspectorId}`
      });
    } catch (error) {
      console.error('Widget code generation error:', error);
      res.status(500).json({ message: 'Failed to generate widget code' });
    }
  });
}