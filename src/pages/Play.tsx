/**
 * Play Page — A dedicated sandbox playground containing the Minecraft mine clicker game.
 */

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MinecraftGame from "src/components/MinecraftGame";

export default function Play() {
  return (
    <div className="space-y-6 lowercase">
      {/* Back button */}
      <div className="select-none">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          back to home
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="font-bold italic font-mono text-lg sm:text-xl text-foreground">
          minecraft clicker
        </h1>
        <p className="text-xs sm:text-[13px] text-muted-foreground font-sans leading-relaxed max-w-xl">
          a simple developer sandbox clicker. click the block to mine resources, spend items to upgrade your pickaxe tier, and gain experience levels.
        </p>
      </div>

      {/* Game Widget */}
      <div className="pt-2">
        <MinecraftGame />
      </div>
    </div>
  );
}
