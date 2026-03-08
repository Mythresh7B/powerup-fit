import { ReactNode } from 'react';

interface TechFrameProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

const TechFrame = ({ children, showHeader = true, showFooter = true }: TechFrameProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Corner Frame Accents */}
      <div className="fixed top-0 left-0 w-16 h-16 border-l border-t border-border/30 z-40 pointer-events-none" />
      <div className="fixed top-0 right-0 w-16 h-16 border-r border-t border-border/30 z-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-16 h-16 border-l border-b border-border/30 z-40 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-16 h-16 border-r border-b border-border/30 z-40 pointer-events-none" />

      {/* Top Header */}
      {showHeader && (
        <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  TEAM 10
                </span>
              </div>
              <div className="w-px h-3 bg-border/30" />
              <span className="text-[10px] font-mono text-muted-foreground/50">EST. 2026</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground/50 hidden sm:inline">LAT: 37.7749°</span>
              <div className="w-px h-3 bg-border/30 hidden sm:block" />
              <span className="text-[10px] font-mono text-muted-foreground/50 hidden sm:inline">LONG: 122.4194°</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col pt-8 pb-10">
        {children}
      </div>

      {/* Bottom Footer */}
      {showFooter && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
          <div className="flex items-center justify-between px-6 py-2 border-t border-border/20">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground/60 hidden sm:inline">SYSTEM.ACTIVE</span>
              <span className="text-[10px] font-mono text-muted-foreground/60 sm:hidden">SYS.ACT</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-2 bg-primary/40"
                    style={{ opacity: 0.3 + (i / 8) * 0.7 }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/40">V1.0.0</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground/60">◐ RENDERING</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary/60 animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/40">FRAME: ∞</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechFrame;
