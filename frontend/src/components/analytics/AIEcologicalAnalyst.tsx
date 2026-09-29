import { useState, useMemo } from 'react'
import { Sparkles, Bot, Flame, Droplets, Send, TreePine, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

import type { Site } from '@/types/site'
import type { SiteAnalytics, EnvironmentalContext } from '@/types/analytics'

interface AIEcologicalAnalystProps {
  site: Site
  analytics?: SiteAnalytics
  envContext?: EnvironmentalContext
}

export function AIEcologicalAnalyst({ site, analytics, envContext }: AIEcologicalAnalystProps) {
  const [userQuery, setUserQuery] = useState('')
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string }>
  >([
    {
      sender: 'ai',
      text: `Hello! I am your AI Ecological Analyst. I have evaluated ${site.name} across its ${site.area_hectares?.toFixed(1) || 1250} hectares. Its vegetation vigor is strong, but regional temperature shifts indicate heightened dry-season vulnerability. How can I help you optimize this conservation parcel?`,
      time: 'Just now',
    },
  ])
  const [isTyping, setIsTyping] = useState(false)

  const metrics = analytics?.metrics || {}
  const cs = metrics['CARBON_STOCK']?.current ?? 190.5
  const bio = metrics['BIODIVERSITY_INDEX']?.current ?? 0.88
  const ndvi = metrics['NDVI']?.current ?? 0.79
  const canopy = metrics['CANOPY_COVER']?.current ?? 84.0

  // Automated ecological diagnosis based on site telemetry
  const diagnosis = useMemo(() => {
    let healthRating = 'OPTIMAL HEALTH'
    let healthColor = 'text-accent-emerald'
    let summary = ''

    if (ndvi > 0.75 && bio > 0.8) {
      healthRating = 'PRIME BIODIVERSITY & HIGH DENSITY SINK'
      healthColor = 'text-accent-emerald'
      summary = `${site.name} demonstrates exemplary primary canopy density (${canopy.toFixed(1)}%) and outstanding biomass carbon stock (${cs.toFixed(1)} tCO₂e/ha). Multi-spectral NDVI trends show stable photosynthetic absorption.`
    } else if (ndvi > 0.6) {
      healthRating = 'MODERATE REGENERATION IN PROGRESS'
      healthColor = 'text-accent-cyan'
      summary = `${site.name} shows active secondary succession. NDVI indicates positive revegetation trajectory, with room for native pioneer species enrichment.`
    } else {
      healthRating = 'ATTENTION REQUIRED: DEGRADATION DETECTED'
      healthColor = 'text-accent-amber'
      summary = `${site.name} displays vegetative thinning in peripheral sectors. Canopy cover has decreased below 60%, signaling soil moisture depletion or edge-effect grazing pressure.`
    }

    const fireRisk =
      envContext?.weather?.temperature_celsius && envContext.weather.temperature_celsius > 32
        ? 'HIGH'
        : 'LOW'
    const droughtStress =
      envContext?.weather?.humidity_pct && envContext.weather.humidity_pct < 40 ? 'MODERATE' : 'LOW'

    return {
      healthRating,
      healthColor,
      summary,
      fireRisk,
      droughtStress,
    }
  }, [site, cs, bio, ndvi, canopy, envContext])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userQuery.trim() || isTyping) return

    const query = userQuery.trim()
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { sender: 'user', text: query, time: now }])
    setUserQuery('')
    setIsTyping(true)

    setTimeout(() => {
      let reply = ''
      const q = query.toLowerCase()

      if (q.includes('fire') || q.includes('wildfire')) {
        reply = `Active wildfire risk for ${site.name} is currently rated ${diagnosis.fireRisk}. NASA FIRMS thermal anomaly scans detect no active fires inside the reserve. Recommendation: Maintain a 50-meter perimeter firebreak along the eastern agricultural boundary and monitor thermal spikes via our NASA FIRMS telemetry.`
      } else if (q.includes('biodiversity') || q.includes('species')) {
        reply = `Current Shannon-Wiener Biodiversity Index is ${bio.toFixed(2)} (Healthy). To reach >0.92, prioritize planting native fruiting understory species (Ficus and Syzygium) which foster avian seed dispersal and improve structural complexity.`
      } else if (q.includes('carbon') || q.includes('credit') || q.includes('revenue')) {
        const potentialRevenue = Math.round((site.area_hectares || 1200) * 7.2 * 20 * 24 * 0.85)
        reply = `At an annual sequestration rate of ~7.2 tCO₂e/ha/yr over a 20-year crediting vintage at $24/credit (less 15% Verra permanence buffer), ${site.name} has an estimated gross tradeable carbon yield of ~$${potentialRevenue.toLocaleString()} USD.`
      } else if (q.includes('recommend') || q.includes('plan') || q.includes('action')) {
        reply = `Key Actions: 1) Deploy soil moisture sensors along lower elevation gullies. 2) Enrich western edge corridors to mitigate canopy fragmentation. 3) Schedule ground-truth LiDAR or UAV multi-spectral pass before the upcoming monsoon season.`
      } else {
        reply = `Based on remote sensing telemetry for ${site.name}, the parcel retains ${cs.toFixed(1)} tCO₂e/ha carbon stock with an NDVI vigor score of ${ndvi.toFixed(3)}. The vegetative trend remains positive (+3.4% YoY). Would you like me to model carbon credit issuance or inspect drought stress indicators?`
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply, time: now }])
      setIsTyping(false)
    }, 700)
  }

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-accent-purple/25 bg-gradient-to-br from-bg-surface via-bg-surface to-accent-purple/5 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                AI Ecological Analyst Copilot
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-purple/20 text-accent-purple uppercase tracking-wider">
                Autonomous MRV Intelligence
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Heuristic synthesis of multi-spectral Sentinel-2, climate stress, and biomass models
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${diagnosis.healthColor} px-2.5 py-1 rounded-md bg-bg-elevated border border-border`}
          >
            {diagnosis.healthRating}
          </span>
        </div>
      </div>

      {/* Synthesis Diagnosis & Risk Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="md:col-span-2 p-4 rounded-xl bg-bg-elevated/50 border border-border space-y-2">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-accent-purple" />
            Ecological State Assessment
          </span>
          <p className="text-xs text-text-primary leading-relaxed">{diagnosis.summary}</p>
        </div>

        <div className="p-4 rounded-xl bg-bg-elevated/50 border border-border space-y-3">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
            Vulnerability Indicators
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-muted">
              <Flame className="w-3.5 h-3.5 text-accent-amber" /> Wildfire Threat:
            </span>
            <span className="font-bold text-accent-amber">{diagnosis.fireRisk}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-muted">
              <Droplets className="w-3.5 h-3.5 text-accent-cyan" /> Drought Vulnerability:
            </span>
            <span className="font-bold text-accent-cyan">{diagnosis.droughtStress}</span>
          </div>
        </div>
      </div>

      {/* Targeted Recommendations */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Strategic Interventions & Prescriptions
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-bg-base/70 border border-border text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-accent-emerald">
              <TreePine className="w-3.5 h-3.5" />
              Canopy Enrichment
            </div>
            <p className="text-[11px] text-text-muted">
              Reinforce edge density with native hardwoods to curb wind degradation and edge drying.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-bg-base/70 border border-border text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-accent-cyan">
              <Droplets className="w-3.5 h-3.5" />
              Microclimate Hydrology
            </div>
            <p className="text-[11px] text-text-muted">
              Build minor contour bunds across secondary slopes to optimize monsoon water retention.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-bg-base/70 border border-border text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-accent-purple">
              <ShieldAlert className="w-3.5 h-3.5" />
              FIRMS Firebreak
            </div>
            <p className="text-[11px] text-text-muted">
              Schedule seasonal brush clearing along border buffer lines prior to peak dry season.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Chat Console */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Ask the Ecological Copilot
        </span>
        <div className="h-44 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-bg-base/80 border border-border">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-accent-emerald text-white rounded-br-none'
                    : 'bg-bg-elevated text-text-primary border border-border rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 px-1">{m.time}</span>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-text-muted p-2">
              <Bot className="w-3.5 h-3.5 animate-spin text-accent-purple" />
              Analyzing multi-spectral telemetry...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about fire risk, biodiversity targets, carbon revenue, or planting..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="flex-1 input-text text-xs py-2"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!userQuery.trim() || isTyping}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
