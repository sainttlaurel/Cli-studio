import Link from 'next/link';
import { Camera, Sparkles, Flame, Zap, Heart, Smartphone, Star, Images, Clock, MessageCircle } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'The filters are literally everything. My bestie and I made a strip in two minutes before heading out. No login, no spam, just vibes!',
    name: 'Chloe M.',
    role: 'Gen-Z Creator',
  },
  {
    quote:
      "I love how the filters don't try to fix your face, they just enhance the color and give that perfect vintage gloss. Obsessed!",
    name: 'Aaliyah K.',
    role: 'Vibe Curator',
  },
  {
    quote:
      'The QR code share is genius. We used it at my birthday party and everyone scanned to download their strips instantly. 10/10!',
    name: 'Ji-Woo L.',
    role: 'Party Host',
  },
];

const NAV_LINKS = [
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/wall', label: 'Wall', icon: MessageCircle },
  { href: '/history', label: 'My Strips', icon: Clock },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 sparkle-bg pointer-events-none" />

      <header className="relative z-10 w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-md">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 -rotate-6">
            <Camera className="text-primary-foreground" size={20} />
          </div>
          <span className="text-2xl font-heading font-bold text-primary tracking-wide">
            Click<span className="text-secondary-foreground">Studio</span>
          </span>
        </div>

        {/* Icon-only pills that are ALWAYS visible, not hidden below a
            breakpoint — only the text label hides on narrow screens.
            Previously these links used `hidden sm:inline-flex`, which
            removed them from the page entirely on real mobile widths
            instead of just compacting them. */}
        <div className="flex items-center gap-1 sm:gap-4">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-0 sm:py-0 rounded-lg hover:bg-secondary/50 sm:hover:bg-transparent text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
            <Sparkles size={14} /> No App Install Needed
          </span>
          <a
            href="#testimonials"
            className="hidden lg:inline text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Loved by creators
          </a>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-12 w-full">
        <div className="flex-1 flex flex-col items-start gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
            <Flame size={16} />
            <span>Y2K Revival Tech-Glam</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-foreground leading-[1.1] tracking-tight">
            Own Your Shot. <br />
            <span className="bg-gradient-to-r from-primary via-destructive to-secondary-foreground bg-clip-text text-transparent">
              Celebrate Yourself.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            The ultimate browser-based photo booth. Pick a gorgeous vibe, strike a pose, and download
            instant high-res strips. No signup, no gatekeeping — just pure fun.
          </p>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/studio"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-heading font-bold text-lg rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.03] transition-all duration-300"
            >
              <Zap className="group-hover:animate-bounce" size={20} />
              <span>Start the Studio</span>
              <span className="absolute -top-2 -right-2 bg-yellow-300 text-yellow-950 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md rotate-12 shadow-sm border border-yellow-400">
                Free
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 w-full border-t border-border/60">
            <div className="flex items-center gap-2 text-foreground/80">
              <Heart className="text-primary" size={18} />
              <span className="text-sm font-medium">Gorgeous Vibes</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Sparkles className="text-primary" size={18} />
              <span className="text-sm font-medium">Filters & Captions</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80 col-span-2 md:col-span-1">
              <Smartphone className="text-primary" size={18} />
              <span className="text-sm font-medium">Mobile & Desktop Ready</span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-md lg:max-w-none flex justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/30 rounded-[2.5rem] blur-2xl -z-10 scale-95" />
          <div className="relative bg-background p-4 rounded-3xl shadow-2xl border-4 border-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500 max-w-sm">
            <Star className="absolute -top-4 -left-4 text-yellow-400" size={28} />
            <Heart className="absolute -bottom-3 -right-3 text-primary" size={28} />
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-xl border-2 border-primary/10 aspect-[4/3] bg-gradient-to-br from-primary/30 to-secondary/40 flex items-center justify-center">
                <Camera className="text-primary/60" size={40} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary/40 aspect-square rounded-lg flex items-center justify-center p-2 text-center border border-primary/5">
                  <span className="text-xs font-heading font-bold text-secondary-foreground">💄 Glam & Glossy</span>
                </div>
                <div className="bg-primary/5 aspect-square rounded-lg flex items-center justify-center p-2 text-center border border-primary/5">
                  <span className="text-xs font-heading font-bold text-primary">⚡ Vintage Film</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-border px-1">
                <span className="text-[10px] font-heading font-bold tracking-widest text-primary">CLICKSTUDIO.APP</span>
                <span className="text-[10px] text-muted-foreground">✨</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="testimonials" className="relative z-10 w-full py-16 bg-background/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-heading font-extrabold text-foreground">Loved by Besties Everywhere</h2>
            <p className="text-muted-foreground mt-2">Hear from real creators who use ClickStudio to capture their vibe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-background p-6 rounded-2xl shadow-md border border-border/60 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-1 text-primary mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-current" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
                  <span className="text-xs text-muted-foreground">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 w-full py-8 border-t border-border bg-background/40 mt-auto text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ClickStudio. Built with 💖 for confident self-expression. No tracking, no ads.
        </p>
      </footer>
    </div>
  );
}