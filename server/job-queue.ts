import { db } from './db';
import { appLogger } from './logger';

// Job types interface
export interface JobPayload {
  id: string;
  type: string;
  data: any;
  userId?: string;
  priority?: number;
}

// Simple in-memory job queue implementation (for Replit compatibility)
class SimpleJobQueue {
  private jobs = new Map<string, any>();
  private processors = new Map<string, Function>();
  private isProcessing = false;

  async add(jobType: string, data: any, options: any = {}) {
    const jobId = `${jobType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      type: jobType,
      data,
      options,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.attempts || 3,
    };
    
    this.jobs.set(jobId, job);
    
    // Process immediately in development
    if (process.env.NODE_ENV === 'development') {
      setImmediate(() => this.processJob(jobId));
    }
    
    return { id: jobId };
  }

  process(jobType: string, processor: Function) {
    this.processors.set(jobType, processor);
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') return;

    const processor = this.processors.get(job.type);
    if (!processor) return;

    job.status = 'running';
    job.attempts++;

    try {
      const result = await processor(job);
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      
      await appLogger.logJob(job.type, 'completed', { 
        jobId: job.id, 
        result: result,
        duration: Date.now() - job.createdAt.getTime() 
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error;
      job.failedAt = new Date();
      
      await appLogger.logJob(job.type, 'failed', { 
        jobId: job.id, 
        error: String(error),
        attempts: job.attempts 
      });
      
      // Retry logic
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        setTimeout(() => this.processJob(jobId), 2000 * job.attempts); // exponential backoff
      }
    }
  }

  on(event: string, handler: Function) {
    // Simple event handling - could be enhanced for production
    console.log(`Job queue event: ${event}`);
  }

  async getJob(jobId: string) {
    return this.jobs.get(jobId);
  }

  async getWaiting() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'pending');
  }

  async getActive() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'running');
  }

  async getCompleted() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'completed');
  }

  async getFailed() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'failed');
  }
}

export const jobQueue = new SimpleJobQueue();

// Job manager class
class JobManager {
  private queue: SimpleJobQueue;

  constructor(queue: SimpleJobQueue) {
    this.queue = queue;
    this.setupJobProcessors();
  }

  private setupJobProcessors() {
    // Inspection report generation
    this.queue.process('generateReport', async (job: any) => {
      const { reportId, userId } = job.data;
      console.log(`Processing report generation for report ${reportId}`);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, reportId, generatedAt: new Date() };
    });

    // AI analysis jobs
    this.queue.process('aiAnalysis', async (job: any) => {
      const { reportId, photoIds } = job.data;
      console.log(`Processing AI analysis for report ${reportId}`);
      
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { success: true, reportId, analysisComplete: true };
    });

    // Lead distribution
    this.queue.process('distributeLead', async (job: any) => {
      const { leadId, contractorIds } = job.data;
      console.log(`Processing lead distribution for lead ${leadId}`);
      
      // Simulate lead distribution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true, leadId, distributed: true };
    });

    // Email notifications
    this.queue.process('sendEmail', async (job: any) => {
      const { to, subject, body } = job.data;
      console.log(`Processing email to ${to}: ${subject}`);
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { success: true, emailSent: true };
    });

    // Calendar sync
    this.queue.process('syncCalendar', async (job: any) => {
      const { inspectorId, bookingData } = job.data;
      console.log(`Processing calendar sync for inspector ${inspectorId}`);
      
      // Simulate calendar sync
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { success: true, synced: true };
    });
  }

  // Helper methods for adding specific job types
  async addReportGenerationJob(reportId: string, userId: string, priority: number = 5) {
    return await this.queue.add('generateReport', { reportId, userId }, { priority });
  }

  async addAIAnalysisJob(reportId: string, photoIds: string[], priority: number = 10) {
    return await this.queue.add('aiAnalysis', { reportId, photoIds }, { priority });
  }

  async addLeadDistributionJob(leadId: string, contractorIds: string[], priority: number = 8) {
    return await this.queue.add('distributeLead', { leadId, contractorIds }, { priority });
  }

  async addEmailJob(to: string, subject: string, body: string, priority: number = 3) {
    return await this.queue.add('sendEmail', { to, subject, body }, { priority });
  }

  async addCalendarSyncJob(inspectorId: string, bookingData: any, priority: number = 5) {
    return await this.queue.add('syncCalendar', { inspectorId, bookingData }, { priority });
  }

  // Queue status methods
  async getQueueStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }
}

// Initialize job manager
export const jobManager = new JobManager(jobQueue);