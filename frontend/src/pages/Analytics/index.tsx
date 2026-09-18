import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'

export default function AnalyticsPage() {
  return (
    <AppShell>
      <TopBar title="Analytics" subtitle="Portfolio-wide environmental metrics" />
      <div className="flex-1 p-6">
        <div className="card p-8 text-center">
          <p className="text-text-secondary text-sm">
            Select a project or site to view detailed analytics.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
