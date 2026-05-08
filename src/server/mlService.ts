import { spawn } from 'child_process';
import path from 'path';

export const mlService = {
  async predict(profileData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const pythonProcess = spawn(pythonCmd, [
        path.join(process.cwd(), 'src', 'server', 'career_model_inference.py')
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdin.write(JSON.stringify({ profileData }));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`ML prediction failed with code ${code}: ${errorOutput}`);
          // Fallback to default if model fails
          return resolve({
            predicted_role: profileData.personalInfo?.currentRole || 'Software Professional',
            predicted_salary_range: '60000 - 90000',
            confidence: 0.5,
            market_fit: 'Good',
            growth_potential: 'High'
          });
        }
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          console.error('Failed to parse ML output:', e);
          reject(e);
        }
      });
    });
  }
};
