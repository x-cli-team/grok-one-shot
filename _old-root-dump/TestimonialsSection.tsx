import React from 'react';
import styles from './TestimonialsSection.module.css';

interface Testimonial {
  name: string;
  title: string;
  company: string;
  quote: string;
  link: string;
  avatar: string;
  featured?: boolean;
  tags?: string[];
}

const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    name: "Alex Chen",
    title: "Senior Software Engineer",
    company: "TechCorp",
    quote: "Grok One-Shot transformed my development workflow. The AI assistance is incredible and it never leaves my terminal.",
    link: "https://github.com/alexchen",
    avatar: "https://github.com/alexchen.png",
    featured: true,
    tags: ["productivity", "ai-assistance", "terminal"]
  },
  {
    name: "Sarah Johnson", 
    title: "DevOps Engineer",
    company: "CloudStartup",
    quote: "Finally, an AI coding assistant that works seamlessly with my existing tools. The tool system is brilliant.",
    link: "https://linkedin.com/in/sarahjohnson",
    avatar: "https://github.com/sarahj.png",
    featured: true,
    tags: ["devops", "automation", "tools"]
  },
  {
    name: "Mike Rodriguez",
    title: "Full Stack Developer", 
    company: "Startup Inc",
    quote: "Open source excellence! The community-driven approach and transparent development make this my go-to AI assistant.",
    link: "https://github.com/mikerodriguez",
    avatar: "https://github.com/mikerodriguez.png",
    featured: true,
    tags: ["open-source", "community", "developer-experience"]
  }
];

export default function TestimonialsSection() {
  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>Loved by Developers</h2>
          <p className={styles.sectionSubtitle}>
            See what the community is saying about X-CLI
          </p>
        </div>
        
        <div className={styles.testimonialsGrid}>
          {SAMPLE_TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
        
        <div className={styles.ctaSection}>
          <p className={styles.ctaText}>Have your own success story?</p>
          <a 
            href="https://github.com/hinetapora/@xagent/x-cli/issues/new?template=testimonial.yml" 
            className={styles.ctaButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            Share Your Experience →
          </a>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className={styles.testimonialCard}>
      <div className={styles.quoteSection}>
        <div className={styles.quoteIcon}>"</div>
        <p className={styles.quote}>{testimonial.quote}</p>
      </div>
      
      <div className={styles.authorSection}>
        <a 
          href={testimonial.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.authorLink}
        >
          <img 
            src={testimonial.avatar} 
            alt={testimonial.name}
            className={styles.avatar}
            loading="lazy"
          />
          <div className={styles.authorInfo}>
            <div className={styles.name}>{testimonial.name}</div>
            <div className={styles.title}>
              {testimonial.title} at {testimonial.company}
            </div>
          </div>
        </a>
      </div>
      
      {testimonial.tags && (
        <div className={styles.tags}>
          {testimonial.tags.slice(0, 2).map(tag => (
            <span key={tag} className={styles.tag}>
              {tag.replace('-', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}