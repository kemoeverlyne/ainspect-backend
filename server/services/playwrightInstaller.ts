import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PlaywrightInstaller {
  static async installBrowsers(): Promise<{ success: boolean; message: string; output?: string }> {
    try {
      console.log('[PLAYWRIGHT INSTALLER] Starting browser installation...');
      
      // Install Playwright browsers
      const { stdout, stderr } = await execAsync('npx playwright install chromium --with-deps');
      
      console.log('[PLAYWRIGHT INSTALLER] Installation output:', stdout);
      if (stderr) {
        console.log('[PLAYWRIGHT INSTALLER] Installation stderr:', stderr);
      }
      
      return {
        success: true,
        message: 'Playwright browsers installed successfully',
        output: stdout
      };
    } catch (error) {
      console.error('[PLAYWRIGHT INSTALLER] Installation failed:', error);
      return {
        success: false,
        message: `Installation failed: ${(error as Error).message}`,
        output: (error as Error).message
      };
    }
  }

  static async checkBrowserInstallation(): Promise<{ installed: boolean; message: string }> {
    try {
      // Check if chromium is installed
      const { stdout } = await execAsync('npx playwright --version');
      console.log('[PLAYWRIGHT INSTALLER] Playwright version:', stdout);
      
      // Try to check if chromium executable exists
      const { stdout: chromiumCheck } = await execAsync('ls -la /opt/render/.cache/ms-playwright/ 2>/dev/null || echo "not found"');
      console.log('[PLAYWRIGHT INSTALLER] Chromium cache check:', chromiumCheck);
      
      return {
        installed: chromiumCheck.includes('chromium'),
        message: `Playwright version: ${stdout.trim()}, Chromium cache: ${chromiumCheck.includes('chromium') ? 'found' : 'not found'}`
      };
    } catch (error) {
      console.error('[PLAYWRIGHT INSTALLER] Check failed:', error);
      return {
        installed: false,
        message: `Check failed: ${(error as Error).message}`
      };
    }
  }
}
