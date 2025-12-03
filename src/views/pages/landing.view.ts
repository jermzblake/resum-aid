import { html } from 'hono/html'
import { ToolComponent } from '../components/tool-card.component'

export const LandingView = () => html`
  <div class="space-y-6">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-3">AI-Powered Resume Tools</h2>
      <p class="text-lg text-gray-600">Choose a tool to get started</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Job Matcher Card -->
      ${ToolComponent(
        'Job Matcher',
        'Find the perfect job for your skills and experience with our advanced job matching tool.',
        '/tools/job-matcher',
        '🎯',
      )}
      <!-- Resume Builder Card -->
      ${ToolComponent(
        'Resume Builder',
        'Create a professional resume tailored to your job applications with ease.',
        '/tools/resume-builder',
        '📝',
      )}

      <!-- Bullet Analyzer Card -->
      ${ToolComponent(
        'Bullet Analyzer',
        'Analyze and optimize your resume bullet points for maximum impact.',
        '/tools/bullet-analyzer',
        '✨',
      )}
    </div>
  </div>
`
