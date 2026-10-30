// Shared street-style classes for the owner area (black & white, thick borders, hard shadows).
export const aInput =
  "w-full border-2 border-foreground bg-background px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:-translate-y-0.5 focus:shadow-hard-sm";
export const aBtn =
  "inline-flex items-center justify-center gap-2 border-2 border-foreground bg-primary px-5 py-2.5 font-street text-sm uppercase tracking-wider text-primary-foreground transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm disabled:pointer-events-none disabled:opacity-50";
export const aBtnGhost =
  "inline-flex items-center justify-center gap-2 border-2 border-foreground bg-background px-4 py-2.5 font-street text-sm uppercase tracking-wider transition hover:-translate-y-0.5 hover:shadow-hard-sm disabled:pointer-events-none disabled:opacity-50";
export const aPanel = "border-2 border-foreground bg-card p-5 shadow-hard md:p-6";
export const aChip = (on: boolean) =>
  `border-2 border-foreground px-3 py-1.5 text-sm font-semibold transition ${on ? "bg-primary text-primary-foreground shadow-hard-sm" : "bg-background hover:-translate-y-0.5"}`;
export const aLabel = "font-mono text-xs uppercase tracking-widest text-muted-foreground";
export const aIn = "animate-in fade-in slide-in-from-bottom-2 duration-300";
