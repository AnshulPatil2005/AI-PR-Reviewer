'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How is this different from GitHub Copilot or Cursor AI?',
    a: 'Copilot and Cursor assist while writing code. CodeLens AI reviews finished pull requests — it sees the full diff in context, applies a multi-stage analysis pipeline, and returns structured, file-level feedback with severity levels. The use cases are complementary, not competing.',
  },
  {
    q: 'Does it read my entire codebase?',
    a: 'No. CodeLens AI only processes the diff of the pull request plus a small amount of surrounding context. It never ingests your full codebase, and your code is not used to train any model.',
  },
  {
    q: 'Which languages are supported?',
    a: 'Python, TypeScript, JavaScript, Go, Rust, Java, Ruby, C, C++, PHP, and Kotlin. Language-specific heuristics run before the LLM layer, so you get accurate results even for niche constructs.',
  },
  {
    q: 'What happens when the AI is wrong?',
    a: 'All findings include confidence scores and severity levels. HIGH findings are conservative — a false positive for HIGH is very rare. Lower severity findings are more speculative and labeled accordingly. You can dismiss any finding with one click.',
  },
  {
    q: 'Is my code secure?',
    a: 'Diffs are transmitted over TLS to our API, processed in ephemeral containers, and never persisted beyond the analysis session. We are SOC 2 Type II compliant and do not subcontract model inference to third-party providers without data processing agreements.',
  },
  {
    q: 'What is the free tier?',
    a: 'The free tier includes 10 PR analyses per month per user, unlimited public repositories, and full access to all detection categories. Paid plans unlock higher limits, team dashboards, custom rules, and priority model routing.',
  },
  {
    q: 'Can I self-host?',
    a: 'Self-hosted deployment is available on the Enterprise plan. It ships as a Docker Compose stack that runs on your own infrastructure, with no outbound LLM calls — your code never leaves your environment.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="pricing" className="py-24 border-b border-dashed border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fog">Common questions</h2>
        </div>

        <div className="space-y-0">
          {FAQS.map((item, i) => (
            <div key={i} className="border-b border-dashed border-border">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left gap-4 group"
              >
                <span className="font-semibold text-fog text-[15px] group-hover:text-accent transition-colors">
                  {item.q}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-fog-muted shrink-0 transition-transform duration-200 ${
                    open === i ? 'rotate-180 text-accent' : ''
                  }`}
                />
              </button>
              {open === i && (
                <div className="pb-5">
                  <p className="text-fog-dim text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
