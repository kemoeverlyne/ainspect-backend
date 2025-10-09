import { runScheduledBackup } from './backup';

export class TaskScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule daily backups at specified hour (24-hour format)
   */
  scheduleDailyBackup(hour: number = 2): void {
    const taskId = 'daily-backup';
    
    // Clear existing schedule if any
    this.clearSchedule(taskId);
    
    // Calculate next execution time
    const scheduleNextBackup = () => {
      const now = new Date();
      const nextRun = new Date();
      
      nextRun.setHours(hour, 0, 0, 0);
      
      // If we've passed today's scheduled time, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      const msUntilNextRun = nextRun.getTime() - now.getTime();
      
      console.log(`[SCHEDULER] Next backup scheduled for: ${nextRun.toISOString()}`);
      
      const timeout = setTimeout(async () => {
        await runScheduledBackup();
        scheduleNextBackup(); // Schedule the next one
      }, msUntilNextRun);
      
      this.intervals.set(taskId, timeout);
    };
    
    scheduleNextBackup();
  }

  /**
   * Schedule weekly backups on specified day and hour
   */
  scheduleWeeklyBackup(dayOfWeek: number = 0, hour: number = 2): void {
    const taskId = 'weekly-backup';
    
    // Clear existing schedule if any
    this.clearSchedule(taskId);
    
    const scheduleNextBackup = () => {
      const now = new Date();
      const nextRun = new Date();
      
      // Set to specified day of week and hour
      const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
      nextRun.setDate(now.getDate() + daysUntilTarget);
      nextRun.setHours(hour, 0, 0, 0);
      
      // If the time has passed today and it's the target day, schedule for next week
      if (daysUntilTarget === 0 && nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }
      
      const msUntilNextRun = nextRun.getTime() - now.getTime();
      
      console.log(`[SCHEDULER] Next weekly backup scheduled for: ${nextRun.toISOString()}`);
      
      const timeout = setTimeout(async () => {
        await runScheduledBackup();
        scheduleNextBackup(); // Schedule the next one
      }, msUntilNextRun);
      
      this.intervals.set(taskId, timeout);
    };
    
    scheduleNextBackup();
  }

  /**
   * Clear a specific scheduled task
   */
  clearSchedule(taskId: string): void {
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearTimeout(interval);
      this.intervals.delete(taskId);
      console.log(`[SCHEDULER] Cleared schedule: ${taskId}`);
    }
  }

  /**
   * Clear all scheduled tasks
   */
  clearAllSchedules(): void {
    for (const [taskId, interval] of this.intervals.entries()) {
      clearTimeout(interval);
      console.log(`[SCHEDULER] Cleared schedule: ${taskId}`);
    }
    this.intervals.clear();
  }

  /**
   * Get status of all scheduled tasks
   */
  getScheduleStatus(): Array<{ taskId: string; active: boolean }> {
    const schedules: Array<{ taskId: string; active: boolean }> = [];
    this.intervals.forEach((_, taskId) => {
      schedules.push({ taskId, active: true });
    });
    return schedules;
  }
}

// Export singleton instance
export const taskScheduler = new TaskScheduler();