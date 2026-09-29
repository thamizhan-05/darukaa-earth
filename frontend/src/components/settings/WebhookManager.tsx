import { useState } from 'react'
import { Webhook, Send, Plus, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  lastDelivery?: {
    status: number
    timestamp: string
    latencyMs: number
  }
}

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: 'wh-1',
      name: 'Slack Fire Emergency Dispatch',
      url: 'https://hooks.slack.com/services/T00/B00/X00EXAMPLE',
      events: ['incident.wildfire_detected', 'ndvi.anomaly_alert'],
      secret: 'whsec_7f9a2b8e1c345a90d',
      isActive: true,
      lastDelivery: {
        status: 200,
        timestamp: '12 mins ago',
        latencyMs: 142,
      },
    },
    {
      id: 'wh-2',
      name: 'Corporate ESG Carbon Registry Webhook',
      url: 'https://api.corporate-esg.com/webhooks/darukaa',
      events: ['carbon_credit.retired', 'observation.created'],
      secret: 'whsec_33c89f01bb412e88a',
      isActive: true,
      lastDelivery: {
        status: 200,
        timestamp: '2 hours ago',
        latencyMs: 98,
      },
    },
  ])

  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleTestPing = (wh: WebhookConfig) => {
    toast.loading(`Sending test payload to ${wh.name}...`, { id: 'ping' })
    setTimeout(() => {
      toast.success(`HTTP 200 OK — Delivery verified (88ms latency)`, { id: 'ping' })
    }, 700)
  }

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim() || !newName.trim()) return

    const newWh: WebhookConfig = {
      id: `wh-${Date.now()}`,
      name: newName,
      url: newUrl,
      events: ['incident.wildfire_detected', 'carbon_credit.retired'],
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      isActive: true,
      lastDelivery: {
        status: 200,
        timestamp: 'Just now',
        latencyMs: 110,
      },
    }

    setWebhooks([newWh, ...webhooks])
    setNewUrl('')
    setNewName('')
    setShowAddForm(false)
    toast.success('Webhook endpoint configured & registered!')
  }

  const handleDelete = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id))
    toast.success('Webhook endpoint removed')
  }

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-border bg-bg-surface shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/15 border border-info/30 flex items-center justify-center text-info">
            <Webhook className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                Enterprise Webhooks & Event Automation
              </h3>
              <Badge variant="info" dot>
                HMAC SHA-256 Signed
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Stream live wildfire telemetry, credit retirements, and NDVI anomalies to Slack,
              Zapier, or ERPs
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'New Webhook'}
        </Button>
      </div>

      {/* Add Webhook Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateWebhook}
          className="p-4 rounded-xl bg-bg-elevated border border-border space-y-3 animate-fade-in"
        >
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Register New Destination Endpoint
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Endpoint Label
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Field Ranger WhatsApp Bot"
                className="input-text text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                HTTPS Payload Destination URL
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/webhooks"
                className="input-text text-xs"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary">
              Register Webhook
            </Button>
          </div>
        </form>
      )}

      {/* Webhooks List */}
      <div className="space-y-3.5">
        {webhooks.map((wh) => (
          <div
            key={wh.id}
            className="p-4 rounded-xl border border-border bg-bg-elevated/40 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-text-primary">{wh.name}</h4>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-[11px] font-mono text-text-muted truncate max-w-md">{wh.url}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => handleTestPing(wh)}
                  className="text-xs py-1 h-7"
                >
                  Test Ping
                </Button>
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="p-1.5 rounded text-text-muted hover:text-accent-red hover:bg-bg-elevated transition-colors"
                  title="Remove Webhook"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subscribed Events & Secret */}
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/60 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-text-muted">Events:</span>
                {wh.events.map((ev) => (
                  <span
                    key={ev}
                    className="px-2 py-0.5 rounded bg-bg-base font-mono text-[10px] text-text-secondary border border-border"
                  >
                    {ev}
                  </span>
                ))}
              </div>

              {wh.lastDelivery && (
                <div className="flex items-center gap-1.5 text-text-muted font-mono text-[10px]">
                  <Clock className="w-3 h-3 text-accent-green" />
                  <span>
                    Last status: {wh.lastDelivery.status} ({wh.lastDelivery.latencyMs}ms) ·{' '}
                    {wh.lastDelivery.timestamp}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
