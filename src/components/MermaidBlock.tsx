import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

let mermaidCounter = 0;

export default function MermaidBlock({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Date.now()}-${mermaidCounter++}`);

  useEffect(() => {
    if (!containerRef.current || !chart.trim()) return;

    let cancelled = false;
    const id = idRef.current;

    (async () => {
      try {
        const { svg } = await mermaid.render(id, chart.trim());
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Invalid Mermaid syntax');
          if (containerRef.current) containerRef.current.innerHTML = '';
        }
        const ghost = document.getElementById('d' + id);
        ghost?.remove();
      }
    })();

    return () => { cancelled = true; };
  }, [chart]);

  if (!chart.trim()) return null;

  return (
    <div className="my-4 rounded-lg border border-border overflow-hidden">
      <div className="px-3 py-1 bg-muted/50 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
        Mermaid Diagram
      </div>
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10">
          {error}
        </div>
      )}
      <div ref={containerRef} className="p-4 flex justify-center [&>svg]:max-w-full" />
    </div>
  );
}
