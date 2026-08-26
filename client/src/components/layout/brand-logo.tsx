import { Handshake, Sparkles } from "lucide-react";

interface BrandLogoProps {
  inverse?: boolean;
}

export function BrandLogo({ inverse = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2" aria-label="Kaam Mitra">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 shadow-md">
        <Handshake className="h-5 w-5 text-white" strokeWidth={2.4} />
        <Sparkles className="absolute right-0.5 top-0.5 h-3 w-3 text-yellow-200" strokeWidth={2.5} />
      </div>
      <span className={`text-xl font-extrabold tracking-tight ${inverse ? "text-white" : "text-primary"}`}>
        Kaam <span className={inverse ? "text-fuchsia-300" : "text-fuchsia-600"}>Mitra</span>
      </span>
    </div>
  );
}