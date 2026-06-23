import { Github, Twitter } from 'lucide-react'

const LINKS = {
  Product: ['Features', 'How it works', 'Demo', 'Changelog', 'Status'],
  Developers: ['Documentation', 'API reference', 'GitHub Actions', 'VS Code extension', 'Self-hosted'],
  Company: ['About', 'Blog', 'Careers', 'Security', 'Privacy policy'],
  Support: ['Help center', 'Community', 'Contact', 'Terms of service', 'Cookie settings'],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-dashed border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-1 mb-4">
              <span className="font-mono font-bold text-accent text-[17px]">CodeLens</span>
              <span className="font-mono font-light text-fog-dim text-[17px]">AI</span>
            </a>
            <p className="text-fog-muted text-sm leading-relaxed mb-5">
              AI-powered code review for teams that ship fast without breaking things.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-8 h-8 flex items-center justify-center border border-dashed border-border hover:border-accent/40 text-fog-muted hover:text-fog transition-all"
              >
                <Github size={14} />
              </a>
              <a
                href="#"
                className="w-8 h-8 flex items-center justify-center border border-dashed border-border hover:border-accent/40 text-fog-muted hover:text-fog transition-all"
              >
                <Twitter size={14} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category}>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-muted mb-4">
                {category}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-fog-muted hover:text-fog text-sm transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-dashed border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-fog-muted">
            © {year} CodeLens AI, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-40" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-fog-muted">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
