import { Pool } from 'pg';
import { db } from '../db';
import * as schema from '@shared/schema';
import fs from 'fs';
import path from 'path';

export interface BackupConfig {
  format: 'json' | 'sql';
  includeData: boolean;
  compression: boolean;
  retentionDays: number;
}

export class BackupService {
  private config: BackupConfig;
  private backupDir: string;

  constructor(config: BackupConfig = {
    format: 'json',
    includeData: true,
    compression: false,
    retentionDays: 30
  }) {
    this.config = config;
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Creates a complete backup of all tables
   */
  async createFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ainspect-backup-${timestamp}.${this.config.format}`;
    const filepath = path.join(this.backupDir, filename);

    console.log(`[BACKUP] Starting full backup to ${filename}`);

    try {
      if (this.config.format === 'json') {
        await this.createJsonBackup(filepath);
      } else {
        await this.createSqlBackup(filepath);
      }

      console.log(`[BACKUP] Successfully created backup: ${filename}`);
      await this.cleanupOldBackups();
      
      return filepath;
    } catch (error) {
      console.error('[BACKUP] Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Creates JSON format backup with all table data
   */
  private async createJsonBackup(filepath: string): Promise<void> {
    const backup = {
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0',
        database: 'ainspect',
        format: 'json'
      },
      data: {}
    };

    // Export all major tables
    const tables = [
      'users',
      'inspection_reports', 
      'branch_offices',
      'user_invitations',
      'team_hierarchies',
      'schedules',
      'contractor_leads',
      'service_referrals',
      'notification_logs',
      'audit_logs',
      'app_settings'
    ];

    for (const tableName of tables) {
      try {
        console.log(`[BACKUP] Exporting table: ${tableName}`);
        
        // Use raw SQL to get data from each table
        const result = await db.execute(`SELECT * FROM ${tableName}`);
        (backup.data as any)[tableName] = result.rows;
        
        console.log(`[BACKUP] Exported ${result.rows.length} rows from ${tableName}`);
      } catch (error: any) {
        console.warn(`[BACKUP] Warning: Could not export table ${tableName}:`, error?.message);
        (backup.data as any)[tableName] = [];
      }
    }

    // Write backup to file
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
  }

  /**
   * Creates SQL dump format backup
   */
  private async createSqlBackup(filepath: string): Promise<void> {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    let sqlDump = `-- AInspect Database Backup
-- Created: ${new Date().toISOString()}
-- Format: SQL

BEGIN;

`;

    const tables = [
      'users',
      'inspection_reports', 
      'branch_offices',
      'user_invitations',
      'team_hierarchies',
      'schedules',
      'contractor_leads',
      'service_referrals',
      'notification_logs',
      'audit_logs',
      'app_settings'
    ];

    for (const tableName of tables) {
      try {
        console.log(`[BACKUP] Exporting SQL for table: ${tableName}`);
        
        // Get table structure
        const structureResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);

        sqlDump += `-- Table: ${tableName}\n`;
        
        if (this.config.includeData) {
          // Export data as INSERT statements
          const dataResult = await pool.query(`SELECT * FROM ${tableName}`);
          
          if (dataResult.rows.length > 0) {
            const columns = structureResult.rows.map(row => row.column_name).join(', ');
            
            for (const row of dataResult.rows) {
              const values = Object.values(row).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                return val;
              }).join(', ');
              
              sqlDump += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
            }
          }
        }
        
        sqlDump += '\n';
      } catch (error: any) {
        console.warn(`[BACKUP] Warning: Could not export table ${tableName}:`, error?.message);
        sqlDump += `-- ERROR: Could not export ${tableName}: ${error?.message}\n\n`;
      }
    }

    sqlDump += 'COMMIT;\n';
    
    fs.writeFileSync(filepath, sqlDump);
    await pool.end();
  }

  /**
   * Clean up old backup files based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('ainspect-backup-'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const file of backupFiles) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filepath);
          console.log(`[BACKUP] Cleaned up old backup: ${file}`);
        }
      }
    } catch (error) {
      console.warn('[BACKUP] Warning: Could not clean up old backups:', error);
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<Array<{ filename: string; created: Date; size: number }>> {
    const files = fs.readdirSync(this.backupDir);
    const backupFiles = files.filter(file => file.startsWith('ainspect-backup-'));
    
    return backupFiles.map(file => {
      const filepath = path.join(this.backupDir, file);
      const stats = fs.statSync(filepath);
      
      return {
        filename: file,
        created: stats.mtime,
        size: stats.size
      };
    }).sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * Create a backup on demand
   */
  static async createBackupNow(config?: BackupConfig): Promise<string> {
    const service = new BackupService(config);
    return await service.createFullBackup();
  }
}

// Scheduled backup function for cron jobs
export async function runScheduledBackup(): Promise<void> {
  try {
    console.log('[BACKUP] Starting scheduled backup...');
    const service = new BackupService({
      format: 'json',
      includeData: true,
      compression: false,
      retentionDays: 30
    });
    
    await service.createFullBackup();
    console.log('[BACKUP] Scheduled backup completed successfully');
  } catch (error) {
    console.error('[BACKUP] Scheduled backup failed:', error);
  }
}