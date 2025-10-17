import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PlaywrightInstaller {
  static async installBrowsers(): Promise<{ success: boolean; message: string; output?: string }> {
    try {
      console.log('[PLAYWRIGHT INSTALLER] Starting browser installation...');
      
      // First, try to install all browsers
      console.log('[PLAYWRIGHT INSTALLER] Installing all browsers...');
      const { stdout, stderr } = await execAsync('npx playwright install --with-deps', {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      console.log('[PLAYWRIGHT INSTALLER] Installation output:', stdout);
      if (stderr) {
        console.log('[PLAYWRIGHT INSTALLER] Installation stderr:', stderr);
      }
      
      // Verify installation
      const verification = await this.checkBrowserInstallation();
      if (verification.installed) {
        return {
          success: true,
          message: 'Playwright browsers installed successfully',
          output: stdout
        };
      } else {
        // Try alternative installation method
        console.log('[PLAYWRIGHT INSTALLER] Trying alternative installation method...');
        const { stdout: altStdout, stderr: altStderr } = await execAsync('npx playwright install', {
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 10
        });
        
        console.log('[PLAYWRIGHT INSTALLER] Alternative installation output:', altStdout);
        if (altStderr) {
          console.log('[PLAYWRIGHT INSTALLER] Alternative installation stderr:', altStderr);
        }
        
        return {
          success: true,
          message: 'Playwright browsers installed with alternative method',
          output: altStdout
        };
      }
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
      
      // Also check if we can find chromium in other common locations
      const { stdout: altCheck } = await execAsync('find /opt -name "*chromium*" -type d 2>/dev/null | head -5 || echo "not found"');
      console.log('[PLAYWRIGHT INSTALLER] Alternative chromium check:', altCheck);
      
      // Check specifically for headless shell
      const { stdout: headlessCheck } = await execAsync('find /opt -name "*headless_shell*" 2>/dev/null | head -3 || echo "not found"');
      console.log('[PLAYWRIGHT INSTALLER] Headless shell check:', headlessCheck);
      
      // Check for the specific version path that the PDF generator expects
      const { stdout: specificPathCheck } = await execAsync('ls -la /opt/render/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell 2>/dev/null || echo "not found"');
      console.log('[PLAYWRIGHT INSTALLER] Specific path check:', specificPathCheck);
      
      const isInstalled = chromiumCheck.includes('chromium') || altCheck.includes('chromium') || headlessCheck.includes('headless_shell') || specificPathCheck.includes('headless_shell');
      
      return {
        installed: isInstalled,
        message: `Playwright version: ${stdout.trim()}, Chromium cache: ${chromiumCheck.includes('chromium') ? 'found' : 'not found'}, Alternative: ${altCheck.includes('chromium') ? 'found' : 'not found'}, Headless shell: ${headlessCheck.includes('headless_shell') ? 'found' : 'not found'}, Specific path: ${specificPathCheck.includes('headless_shell') ? 'found' : 'not found'}`
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
