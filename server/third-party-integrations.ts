/**
 * Third-Party API Integrations for External Template Services
 * Handles secure API connections, data fetching, and synchronization
 */

import axios, { AxiosResponse } from 'axios';
import { IStorage } from './storage';
import { InsertThirdPartyInspectionItem, InsertApiIntegration } from '@shared/schema';

export interface ExternalTemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  roomType?: string;
  isRequired: boolean;
  severity: 'safety' | 'high' | 'medium' | 'low';
  ashiCompliance: boolean;
}

export interface LegacyTemplateItem {
  itemId: string;
  name: string;
  details: string;
  section: string;
  applicableRooms?: string[];
  mandatory: boolean;
  priority: 'critical' | 'major' | 'moderate' | 'minor';
  standardCompliant: boolean;
}

export class ThirdPartyIntegrationService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Sync items from External Template API
   */
  async syncExternalTemplateItems(): Promise<{ success: boolean; itemCount: number; error?: string }> {
    try {
      const integration = await this.storage.getApiIntegrationByProvider('external_template_a');
      
      if (!integration || !integration.isActive) {
        throw new Error('external_template_a integration not configured or inactive');
      }

      // Update sync status to in_progress
      await this.storage.updateApiIntegration(integration.id, {
        syncStatus: 'in_progress',
        errorMessage: null
      });

      const response = await this.fetchexternal_template_aItems(integration.apiKey, integration.baseUrl);
      const external_template_aItems = response.data;

      // Transform external_template_a items to our schema
      const transformedItems: InsertThirdPartyInspectionItem[] = external_template_aItems.map((item: ExternalTemplateItem) => ({
        source: 'external_template_a' as const,
        sourceItemId: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        roomType: item.roomType || null,
        isRequired: item.isRequired,
        severity: item.severity,
        ashiCompliance: item.ashiCompliance,
        metadata: { originalData: item }
      }));

      // Sync to database
      await this.storage.syncThirdPartyItems('external_template_a', transformedItems);

      // Update integration status
      await this.storage.updateApiIntegration(integration.id, {
        syncStatus: 'success',
        lastSyncAt: new Date(),
        itemCount: transformedItems.length,
        errorMessage: null
      });

      return { success: true, itemCount: transformedItems.length };

    } catch (error) {
      console.error('external_template_a sync error:', error);
      
      // Update integration status with error
      const integration = await this.storage.getApiIntegrationByProvider('external_template_a');
      if (integration) {
        await this.storage.updateApiIntegration(integration.id, {
          syncStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return { 
        success: false, 
        itemCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sync items from external_template_b API
   */
  async syncexternal_template_bItems(): Promise<{ success: boolean; itemCount: number; error?: string }> {
    try {
      const integration = await this.storage.getApiIntegrationByProvider('external_template_b');
      
      if (!integration || !integration.isActive) {
        throw new Error('external_template_b integration not configured or inactive');
      }

      // Update sync status to in_progress
      await this.storage.updateApiIntegration(integration.id, {
        syncStatus: 'in_progress',
        errorMessage: null
      });

      const response = await this.fetchexternal_template_bItems(integration.apiKey, integration.baseUrl, integration.apiSecret || undefined);
      const external_template_bItems = response.data;

      // Transform external_template_b items to our schema
      const transformedItems: InsertThirdPartyInspectionItem[] = external_template_bItems.map((item: LegacyTemplateItem) => ({
        source: 'external_template_b' as const,
        sourceItemId: item.itemId,
        title: item.name,
        description: item.details,
        category: item.section,
        roomType: item.applicableRooms ? item.applicableRooms[0] : null,
        isRequired: item.mandatory,
        severity: this.mapexternal_template_bPriority(item.priority),
        ashiCompliance: item.standardCompliant,
        metadata: { originalData: item, applicableRooms: item.applicableRooms }
      }));

      // Sync to database
      await this.storage.syncThirdPartyItems('external_template_b', transformedItems);

      // Update integration status
      await this.storage.updateApiIntegration(integration.id, {
        syncStatus: 'success',
        lastSyncAt: new Date(),
        itemCount: transformedItems.length,
        errorMessage: null
      });

      return { success: true, itemCount: transformedItems.length };

    } catch (error) {
      console.error('external_template_b sync error:', error);
      
      // Update integration status with error
      const integration = await this.storage.getApiIntegrationByProvider('external_template_b');
      if (integration) {
        await this.storage.updateApiIntegration(integration.id, {
          syncStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return { 
        success: false, 
        itemCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Fetch items from external_template_a API
   */
  private async fetchexternal_template_aItems(apiKey: string, baseUrl: string): Promise<AxiosResponse<ExternalTemplateItem[]>> {
    return axios.get(`${baseUrl}/api/v1/inspection-items`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Fetch items from external_template_b API
   */
  private async fetchexternal_template_bItems(apiKey: string, baseUrl: string, apiSecret?: string): Promise<AxiosResponse<LegacyTemplateItem[]>> {
    const headers: any = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    };

    if (apiSecret) {
      headers['X-API-Secret'] = apiSecret;
    }

    return axios.get(`${baseUrl}/api/inspection-templates/items`, {
      headers,
      timeout: 30000
    });
  }

  /**
   * Map external_template_b priority to our severity system
   */
  private mapexternal_template_bPriority(priority: string): 'safety' | 'high' | 'medium' | 'low' {
    switch (priority) {
      case 'critical':
        return 'safety';
      case 'major':
        return 'high';
      case 'moderate':
        return 'medium';
      case 'minor':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Get inspection items for a specific room type from cache
   */
  async getInspectionItemsForRoom(roomType: string, source?: 'external_template_a' | 'external_template_b'): Promise<any[]> {
    try {
      let items;
      
      if (source) {
        items = await this.storage.getThirdPartyInspectionItemsBySource(source);
        items = items.filter(item => item.roomType === roomType);
      } else {
        items = await this.storage.getThirdPartyInspectionItemsByRoomType(roomType);
      }

      return items;
    } catch (error) {
      console.error(`Error fetching inspection items for room ${roomType}:`, error);
      return [];
    }
  }

  /**
   * Setup default API integrations (for development/testing)
   */
  async setupDefaultIntegrations(): Promise<void> {
    try {
      // Setup external_template_a integration (placeholder)
      const external_template_aIntegration: InsertApiIntegration = {
        provider: 'external_template_a',
        apiKey: 'external_template_a_API_KEY_PLACEHOLDER', // Will be replaced with real key
        baseUrl: 'https://api.external_template_a.com',
        isActive: false, // Inactive until real credentials are provided
        syncStatus: 'failed',
        errorMessage: 'API key required'
      };

      await this.storage.createApiIntegration(external_template_aIntegration);

      // Setup external_template_b integration (placeholder)
      const external_template_bIntegration: InsertApiIntegration = {
        provider: 'external_template_b',
        apiKey: 'external_template_b_API_KEY_PLACEHOLDER', // Will be replaced with real key
        apiSecret: 'external_template_b_API_SECRET_PLACEHOLDER',
        baseUrl: 'https://api.external_template_b.com',
        isActive: false, // Inactive until real credentials are provided
        syncStatus: 'failed',
        errorMessage: 'API credentials required'
      };

      await this.storage.createApiIntegration(external_template_bIntegration);

      console.log('Default API integrations created (inactive until credentials provided)');
    } catch (error) {
      console.error('Error setting up default integrations:', error);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(provider: 'external_template_a' | 'external_template_b'): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = await this.storage.getApiIntegrationByProvider(provider);
      
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      if (provider === 'external_template_a') {
        await this.fetchexternal_template_aItems(integration.apiKey, integration.baseUrl);
      } else {
        await this.fetchexternal_template_bItems(integration.apiKey, integration.baseUrl, integration.apiSecret || undefined);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
}