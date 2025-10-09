import type { Express } from "express";
import { authenticateToken, type AuthenticatedRequest } from "./auth";
import { storage } from "./storage";
import { eq, sql, gte, lte, and } from "drizzle-orm";
import { db } from "./db";
import { inspectionReports, auditLogs } from "@shared/schema";

export function registerInexternal_template_analyticsRoutes(app: Express) {
  
  // KPI Dashboard - Inspector's personal metrics
  app.get('/api/inspector/analytics/kpis', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const inspectorId = req.user.id;
      const { from, to } = req.query;
      
      // Default to last 12 weeks if no date range provided
      const endDate = to ? new Date(to as string) : new Date();
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);

      // Get inspector's inspections in date range
      const inspectorInspections = await db
        .select()
        .from(inspectionReports)
        .where(
          and(
            eq(inspectionReports.inspectorId, inspectorId),
            gte(inspectionReports.createdAt, startDate),
            lte(inspectionReports.createdAt, endDate)
          )
        );

      // Calculate weekly inspection counts
      const weeklyData: { weekStart: string; count: number }[] = [];
      const weeklyMap = new Map<string, number>();
      
      inspectorInspections.forEach(inspection => {
        if (inspection.createdAt) {
          const date = new Date(inspection.createdAt);
          const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
        }
      });

      weeklyMap.forEach((count, weekStart) => {
        weeklyData.push({ weekStart, count });
      });
      weeklyData.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

      // Calculate average turnaround time (created to completed)
      const completedInspections = inspectorInspections.filter(i => 
        i.status === 'completed' && i.createdAt && i.completedAt
      );
      
      let averageTurnaroundDays = 0;
      if (completedInspections.length > 0) {
        const totalTurnaroundMs = completedInspections.reduce((sum, inspection) => {
          const created = new Date(inspection.createdAt!).getTime();
          const completed = new Date(inspection.completedAt!).getTime();
          return sum + (completed - created);
        }, 0);
        averageTurnaroundDays = totalTurnaroundMs / completedInspections.length / (1000 * 60 * 60 * 24);
      }

      // Calculate lead conversion rate (basic calculation based on completed reports with notes/issues)
      const totalInspections = inspectorInspections.length;
      const inspectionsWithIssues = inspectorInspections.filter(i => 
        i.status === 'completed' && (i.notes && i.notes.length > 50) // Assume detailed notes indicate issues found
      ).length;
      
      const leadConversionRate = totalInspections > 0 ? inspectionsWithIssues / totalInspections : 0;

      // Calculate additional metrics
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      const thisWeekInspections = inspectorInspections.filter(i => 
        i.createdAt && new Date(i.createdAt) >= thisWeekStart
      ).length;

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekInspections = inspectorInspections.filter(i => 
        i.createdAt && 
        new Date(i.createdAt) >= lastWeekStart && 
        new Date(i.createdAt) < thisWeekStart
      ).length;

      res.json({
        inspectionsPerWeek: weeklyData,
        averageTurnaroundDays: Math.round(averageTurnaroundDays * 100) / 100,
        leadConversionRate: Math.round(leadConversionRate * 100) / 100,
        totalInspections,
        completedInspections: completedInspections.length,
        thisWeekInspections,
        lastWeekInspections,
        weekOverWeekChange: lastWeekInspections > 0 ? 
          Math.round(((thisWeekInspections - lastWeekInspections) / lastWeekInspections) * 100) : 0
      });

    } catch (error) {
      console.error('Inspector KPI analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch KPI analytics' });
    }
  });

  // Geographic Heatmap - Inspector's territory
  app.get('/api/inspector/analytics/geo', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const inspectorId = req.user.id;
      const { by = 'zip', from, to } = req.query;
      
      const endDate = to ? new Date(to as string) : new Date();
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year

      // Get inspector's inspections with location data
      const inspectorInspections = await db
        .select()
        .from(inspectionReports)
        .where(
          and(
            eq(inspectionReports.inspectorId, inspectorId),
            gte(inspectionReports.createdAt, startDate),
            lte(inspectionReports.createdAt, endDate)
          )
        );

      // Group by region (ZIP or county)
      const regionMap = new Map<string, number>();
      
      inspectorInspections.forEach(inspection => {
        let region = '';
        // Extract ZIP from property address (basic parsing)
        if (by === 'zip' && inspection.propertyAddress) {
          const zipMatch = inspection.propertyAddress.match(/\b\d{5}(-\d{4})?\b/);
          region = zipMatch ? zipMatch[0] : '';
        } else if (by === 'county' && inspection.propertyAddress) {
          // Extract city/county from address (basic parsing)
          const addressParts = inspection.propertyAddress.split(',');
          region = addressParts.length > 1 ? addressParts[1].trim() : '';
        } else if (by === 'state' && inspection.propertyAddress) {
          // Extract state from address (basic parsing)
          const addressParts = inspection.propertyAddress.split(',');
          if (addressParts.length > 2) {
            const stateZip = addressParts[2].trim();
            const stateMatch = stateZip.match(/^([A-Z]{2})/);
            region = stateMatch ? stateMatch[1] : '';
          }
        }
        
        if (region) {
          regionMap.set(region, (regionMap.get(region) || 0) + 1);
        }
      });

      const geoData = Array.from(regionMap.entries()).map(([region, count]) => ({
        region,
        count
      })).sort((a, b) => b.count - a.count);

      res.json(geoData);

    } catch (error) {
      console.error('Inspector geo analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch geographic analytics' });
    }
  });

  // Activity Logs - Inspector's actions
  app.get('/api/inspector/logs', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const inspectorId = req.user.id;
      const { type, limit = '50', from, to } = req.query;
      
      const endDate = to ? new Date(to as string) : new Date();
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      let whereConditions = [
        eq(auditLogs.userId, inspectorId),
        gte(auditLogs.timestamp, startDate),
        lte(auditLogs.timestamp, endDate)
      ];

      // Filter by log type if specified
      if (type && ['login', 'api', 'ui'].includes(type as string)) {
        if (type === 'login') {
          whereConditions.push(sql`${auditLogs.action} ILIKE '%login%'`);
        } else if (type === 'api') {
          whereConditions.push(sql`${auditLogs.action} ILIKE '%api%' OR ${auditLogs.action} ILIKE '%error%'`);
        } else if (type === 'ui') {
          whereConditions.push(sql`${auditLogs.action} ILIKE '%ui%' OR ${auditLogs.entityType} = 'ui_interaction'`);
        }
      }

      const logs = await db
        .select()
        .from(auditLogs)
        .where(and(...whereConditions))
        .orderBy(sql`${auditLogs.timestamp} DESC`)
        .limit(parseInt(limit as string));

      res.json(logs);

    } catch (error) {
      console.error('Inspector logs error:', error);
      res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
  });

  // Export KPIs (CSV/PDF)
  app.get('/api/inspector/exports/kpis', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const inspectorId = req.user.id;
      const { format = 'csv', from, to } = req.query;
      
      // Get KPI data (reuse logic from KPI endpoint)
      const endDate = to ? new Date(to as string) : new Date();
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);

      const inspectorInspections = await db
        .select()
        .from(inspectionReports)
        .where(
          and(
            eq(inspectionReports.inspectorId, inspectorId),
            gte(inspectionReports.createdAt, startDate),
            lte(inspectionReports.createdAt, endDate)
          )
        );

      if (format === 'csv') {
        const csvData = [
          ['Date', 'Total Inspections', 'Completed', 'In Progress', 'Conversion Rate'],
          ...inspectorInspections.map(inspection => [
            inspection.createdAt?.toISOString().split('T')[0] || '',
            '1',
            inspection.status === 'completed' ? '1' : '0',
            inspection.status === 'in_progress' ? '1' : '0',
            (inspection.notes && inspection.notes.length > 50) ? '1' : '0'
          ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inspector-kpis-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // For PDF, return JSON that frontend can use to generate PDF
        res.json({
          message: 'PDF export not yet implemented',
          data: inspectorInspections.length
        });
      }

    } catch (error) {
      console.error('Inspector KPI export error:', error);
      res.status(500).json({ message: 'Failed to export KPI data' });
    }
  });

  // Export Logs (CSV/PDF)
  app.get('/api/inspector/exports/logs', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const inspectorId = req.user.id;
      const { format = 'csv', from, to, type } = req.query;
      
      const endDate = to ? new Date(to as string) : new Date();
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      let whereConditions = [
        eq(auditLogs.userId, inspectorId),
        gte(auditLogs.timestamp, startDate),
        lte(auditLogs.timestamp, endDate)
      ];

      if (type && ['login', 'api', 'ui'].includes(type as string)) {
        if (type === 'login') {
          whereConditions.push(sql`${auditLogs.action} ILIKE '%login%'`);
        } else if (type === 'api') {
          whereConditions.push(sql`${auditLogs.action} ILIKE '%api%' OR ${auditLogs.action} ILIKE '%error%'`);
        } else if (type === 'ui') {
          whereConditions.push(sql`${auditLogs.action} ILIKE '%ui%' OR ${auditLogs.entityType} = 'ui_interaction'`);
        }
      }

      const logs = await db
        .select()
        .from(auditLogs)
        .where(and(...whereConditions))
        .orderBy(sql`${auditLogs.timestamp} DESC`);

      if (format === 'csv') {
        const csvData = [
          ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'User Agent'],
          ...logs.map(log => [
            log.timestamp.toISOString(),
            log.action,
            log.entityType,
            log.entityId || '',
            log.ipAddress || '',
            log.userAgent || ''
          ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inspector-logs-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        res.json({
          message: 'PDF export not yet implemented',
          data: logs.length
        });
      }

    } catch (error) {
      console.error('Inspector logs export error:', error);
      res.status(500).json({ message: 'Failed to export logs data' });
    }
  });
}