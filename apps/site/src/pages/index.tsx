import React, { useState } from 'react';
import styles from './index.module.css';
import TestimonialsSection from '@site/src/components/TestimonialsSection';

export default function Page() {
  return (
    <>
      <GrokOneShotHero />
      <OpenSourceSection />
      <FeaturesSection />
      <CollaborationSection />
      <RoadmapSection />
      <TestimonialsSection />
      <Footer />
    </>
  );
}

function GrokOneShotHero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className={styles.hero}>
      {/* === LIGHT STACK =================================================== */}
      <div className={styles.lightStack} aria-hidden>
        <div className={styles.lightGradient1} />
        <div className={styles.lightGradient2} />
        <div className={styles.lightOverlay1} />
        <div className={styles.lightOverlay2} />
      </div>

      {/* === CONTENT ======================================================= */}
      <div className={styles.content}>
        {/* Top nav */}
        <div className={styles.topNav}>
          <div className={styles.navLeft}>
            <LogoMark />
            <NavLink href="/docs/overview">Docs</NavLink>
            <NavLink href="/docs/roadmap">Roadmap</NavLink>
            <NavLink href="https://discord.com/channels/1315720379607679066/1315822328139223064">Discord</NavLink>
            <NavLink href="https://github.com/x-cli-team/grok-one-shot">GitHub</NavLink><NavLink href="#powerful-features">PARITY-[67%]</NavLink>
          </div>
          <div className={styles.navRight}>
            <ChipBtn variant="outline" label="Get Started" href="/docs/getting-started/installation" />
          </div>
          <button 
            className={styles.hamburger} 
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        </div>

        {/* Installation Options - Moved Up */}
        <div className={styles.installSection}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            alignItems: 'center',
            marginBottom: '10.5rem'
          }}>
            <ChipBtn variant="outline" label="npx -y @xagent/one-shot@latest" showCopyIcon={true} />
            <ChipBtn variant="outline" label="npm install -g @xagent/one-shot@latest" showCopyIcon={true} />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenuOverlay} onClick={() => setMobileMenuOpen(false)}>
            <div className={styles.mobileMenu}>
              <NavLink href="/docs/overview">Docs</NavLink>
              <NavLink href="/docs/roadmap">Roadmap</NavLink>
              <NavLink href="https://discord.com/channels/1315720379607679066/1315822328139223064">Discord</NavLink>
              <NavLink href="https://github.com/x-cli-team/grok-one-shot">GitHub</NavLink>
              <ChipBtn variant="outline" label="Get Started" href="/docs/getting-started/installation" />
            </div>
          </div>
        )}

        {/* Hero card (moved up from bottom) */}
        <div className={styles.heroCardContainer}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardBackground}>
              <video className={styles.heroCardVideo} autoPlay muted loop playsInline>
                <source src="/grok-hero-demo-video.mp4" type="video/mp4" />
                <source src="/img/grok-hero-video.mp4" type="video/mp4" />
              </video>
            </div>
            <div className={styles.heroCardOverlay}></div>
            <div className={styles.heroCardContent}>
              <div className={styles.heroCardText}>
                <h3 className={styles.heroCardTitle}>Grok One-Shot</h3>
                <p className={styles.heroCardDescription}>Revolutionary open source terminal AI that surpasses Claude Code with blazing-fast evolution, native x.ai integration, and 95% cost savings. Experience Plan Mode excellence with Shift+Tab twice activation, plus cutting-edge features that ship weekly. The future of AI-powered development, today.</p>
                
                <div className={styles.featureGrid}>
                  <div className={styles.featureItem}>
                    <strong className={styles.featureLabel}>Modalities</strong>
                    <span className={styles.featureValue}>🗣️ 📝 🖼️ 🌐</span>
                  </div>
                  <div className={styles.featureItem}>
                    <strong className={styles.featureLabel}>Tools Available</strong>
                    <span className={styles.featureValue}>25+</span>
                  </div>
                </div>

                <div className={styles.featureList}>
                  <ul>
                    <li>Advanced file operations</li>
                    <li>Code-aware editing</li>
                    <li>Multi-file transactions</li>
                    <li>Web integration</li>
                    <li>MCP protocol support</li>
                    <li>AST code analysis</li>
                    <li>Symbol search & references</li>
                    <li>Context-aware tooltips</li>
                    <li>Auto-documentation system</li>
                    <li>Task management workflows</li>
                  </ul>
                </div>
              </div>

              <div className={styles.cardActions}>
                <a className={styles.btnPrimary} href="/docs/getting-started/installation">Get Started</a>
                <a className={styles.btnSecondary} href="/docs/getting-started/quickstart">View Quickstart</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom overlays aligned to main container width */}
      <div className={styles.bottomOverlay}>
        <div className={styles.bottomContent}>
          <button 
            className={styles.bottomIcon}
            onClick={() => {
              const nextSection = document.getElementById('opensource-section');
              nextSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-label="Scroll to next section"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.arrowIcon}>
              <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v16.19l6.22-6.22a.75.75 0 111.06 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 111.06-1.06l6.22 6.22V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          <ChipBtn variant="outline" label="Join as Collaborator" href="https://github.com/x-cli-team/grok-one-shot/issues/new?template=testimonial.yml" />
        </div>
      </div>

    </div>
  );
}

function OpenSourceSection() {
  return (
    <section id="opensource-section" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Open Source</h2>
        <p className={styles.sectionDescription}>
          Built by developers, for developers. Grok One-Shot is completely open source and community-driven.
        </p>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h3>MIT Licensed</h3>
            <p>Free to use, modify, and distribute. Build on top of Grok One-Shot for your own projects.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Community Driven</h3>
            <p>Every feature request, bug report, and contribution shapes the future of the project.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Transparent Development</h3>
            <p>All development happens in the open. Track progress and contribute to the roadmap.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="powerful-features" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Powerful Features</h2>
        <p className={styles.sectionDescription}>
          Everything you need for AI-powered terminal development workflows.
        </p>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h3>🎯 Plan Mode<div className={styles.completionBadge}>60% Complete</div></h3>
            <p>Claude Code's signature read-only exploration with Shift+Tab twice activation. Safe codebase analysis and AI-powered implementation planning.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>📁 Advanced File Operations<div className={styles.completionBadge}>70% Complete</div></h3>
            <p>Read, write, edit, and search files with intelligent AI assistance.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>⚡ Multi-File Transactions<div className={styles.completionBadge}>70% Complete</div></h3>
            <p>Atomic operations across multiple files with rollback capabilities.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>🌐 Web Integration<div className={styles.completionBadge}>80% Complete</div></h3>
            <p>Fetch and process web content with AI-powered analysis.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>🔌 MCP Protocol<div className={styles.completionBadge}>40% Complete</div></h3>
            <p>Extensible architecture supporting Model Context Protocol servers.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>📋 Task Management<div className={styles.completionBadge}>50% Complete</div></h3>
            <p>Organize and track complex development workflows.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>🧠 Code-Aware Editing<div className={styles.completionBadge}>30% Complete</div></h3>
            <p>Intelligent code modifications with syntax understanding.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>🎨 Claude Code Response Styling<div className={styles.completionBadge}>99% Complete</div></h3>
            <p>Perfect visual parity with Claude Code featuring cyan syntax highlighting, colored emojis, smart metadata dimming, and professional terminal formatting.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollaborationSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Join the Community</h2>
        <p className={styles.sectionDescription}>
          Become a collaborator and help shape the future of terminal AI tools.
        </p>
        <div className={styles.collaborationGrid}>
          <div className={styles.collaborationCard}>
            <h3>Submit a Testimonial</h3>
            <p>Share your experience and automatically become a repository collaborator.</p>
            <a href="https://github.com/x-cli-team/grok-one-shot/issues/new?template=testimonial.yml" className={styles.cardButton}>
              Join as Collaborator
            </a>
          </div>
          <div className={styles.collaborationCard}>
            <h3>Professional Benefits</h3>
            <p>Repository access, backlinks, GitHub profile enhancement, and networking opportunities.</p>
          </div>
          <div className={styles.collaborationCard}>
            <h3>Technical Skills</h3>
            <p>Gain experience with TypeScript, Node.js, AI integration, and open-source development.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Roadmap</h2>
        <p className={styles.sectionDescription}>
          Our journey to Claude Code-level intelligence and beyond.
        </p>
        <div className={styles.roadmapGrid}>
          <div className={styles.roadmapCard}>
            <div className={styles.roadmapStatus}>✅ Complete</div>
            <h3>🎯 Plan Mode</h3>
            <p>Claude Code's signature read-only exploration with Shift+Tab twice activation and AI-powered planning.</p>
          </div>
          <div className={styles.roadmapCard}>
            <div className={styles.roadmapStatus}>✅ Complete</div>
            <h3>Core Tool System</h3>
            <p>File operations, bash execution, search, and basic AI integration.</p>
          </div>
          <div className={styles.roadmapCard}>
            <div className={styles.roadmapStatus}>✅ Complete</div>
            <h3>Advanced Features</h3>
            <p>Web integration, multi-file operations, and enhanced AI capabilities.</p>
          </div>
          <div className={styles.roadmapCard}>
            <div className={styles.roadmapStatus}>📋 Planned</div>
            <h3>IDE Integration</h3>
            <p>VS Code extension, Vim plugins, and advanced editor support.</p>
          </div>
        </div>
        <div className={styles.roadmapCta}>
          <a href="/docs/roadmap" className={styles.roadmapButton}>View Full Roadmap</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerSection}>
            <h3>Docs</h3>
            <ul>
              <li><a href="/docs/overview">Overview</a></li>
              <li><a href="/docs/getting-started/installation">Installation</a></li>
              <li><a href="/docs/architecture/overview">Architecture</a></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h3>Community</h3>
            <ul>
              <li><a href="https://discord.com/channels/1315720379607679066/1315822328139223064">Discord</a></li>
              <li><a href="https://github.com/x-cli-team/grok-one-shot/issues">GitHub Issues</a></li>
              <li><a href="https://www.npmjs.com/package/@xagent/one-shot">NPM Package</a></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h3>More</h3>
            <ul>
              <li><a href="/docs/roadmap">Roadmap</a></li>
              <li><a href="/docs/community/testimonials">Testimonials</a></li>
              <li><a href="https://github.com/x-cli-team/grok-one-shot">GitHub</a></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h3>Credits</h3>
            <ul>
              <li><a href="https://github.com/x-cli-team/grok-one-shot">Original X CLI Repository</a></li>
              <li><a href="https://github.com/homanp">Ismail Pelaseyed</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>Copyright © 2025 Grok One-Shot.</p>
        </div>
      </div>
    </footer>
  );
}

function ChipBtn({
  label,
  variant = "solid",
  leadingDot = false,
  href,
  showCopyIcon = false,
}: {
  label: string;
  variant?: "solid" | "outline" | "ghost";
  leadingDot?: boolean;
  href?: string;
  showCopyIcon?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  
  const variantClass = variant === "solid" ? styles.chipBtnSolid 
    : variant === "outline" ? styles.chipBtnOutline 
    : styles.chipBtnGhost;
    
  const Element = href ? 'a' : 'button';
  
  const handleCopy = async () => {
    if (showCopyIcon && !href) {
      try {
        await navigator.clipboard.writeText(label);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };
  
  return (
    <Element 
      className={`${styles.chipBtn} ${variantClass} ${copied ? styles.copied : ''}`}
      {...(href ? { href } : {})}
      {...(!href && showCopyIcon ? { onClick: handleCopy } : {})}
    >
      {leadingDot ? <span className={styles.leadingDot} /> : null}
      <span>{label}</span>
      {showCopyIcon ? (
        copied ? (
          <svg className={styles.btnIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className={styles.btnIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V9.375A3.375 3.375 0 0 1 7.502 6ZM15 9.375a1.875 1.875 0 0 0-1.875-1.875H7.502a1.875 1.875 0 0 0-1.875 1.875V21a1.5 1.5 0 0 0 1.5 1.5h7.5A1.5 1.5 0 0 0 16.5 21V9.375ZM6 3.75A.75.75 0 0 1 6.75 3h6.75a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM8.25 1.5a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
        )
      ) : (
        <svg className={styles.btnIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M8.25 3.75H19.5a.75.75 0 0 1 .75.75v11.25a.75.75 0 0 1-1.5 0V6.31L5.03 20.03a.75.75 0 0 1-1.06-1.06L17.69 5.25H8.25a.75.75 0 0 1 0-1.5Z" clipRule="evenodd" />
        </svg>
      )}
    </Element>
  );
}

function NavLink({ children, href }: { children: React.ReactNode; href: string }) {
  const isExternal = href.startsWith('http');
  return (
    <a 
      href={href} 
      className={styles.navLink}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

function LogoMark() {
  return (
    <div className={styles.logo}>
      <img 
        src="/img/logo.png" 
        alt="Grok One-Shot Logo" 
        className={styles.logoIcon}
        width="32" 
        height="32"
      />
      <span className={styles.logoText}>Grok One-Shot</span>
    </div>
  );
}