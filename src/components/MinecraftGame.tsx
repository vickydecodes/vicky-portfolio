/**
 * MinecraftGame — A retro, pixel-perfect clicker mining game built using @xefreh/minecraft-assets-react.
 * Allows users to mine ores, collect items, upgrade pickaxes, gain XP, and level up with sound effects!
 */

import { useState, useCallback } from "react";
import { MinecraftIcon, usePlaySound } from "@xefreh/minecraft-assets-react";

import {
  wooden_pickaxe,
  stone_pickaxe,
  iron_pickaxe,
  golden_pickaxe,
  diamond_pickaxe,
  netherite_pickaxe,
  coal,
  raw_iron,
  raw_gold,
  diamond,
} from "@xefreh/minecraft-assets-react/items";

import {
  stone as block_stone,
  cobblestone,
  coal_ore,
  iron_ore,
  gold_ore,
  diamond_ore,
} from "@xefreh/minecraft-assets-react/blocks";

// Sound imports
// @ts-ignore
import popSound from "@xefreh/minecraft-assets-react/sounds/random_pop";
// @ts-ignore
import orbSound from "@xefreh/minecraft-assets-react/sounds/random_orb";
// @ts-ignore
import levelupSound from "@xefreh/minecraft-assets-react/sounds/random_levelup";
// @ts-ignore
import clickSound from "@xefreh/minecraft-assets-react/sounds/random_click";

interface OreType {
  name: string;
  block: string;
  maxHp: number;
  rewardIcon: string;
  rewardKey: keyof Inventory;
  rewardName: string;
  xpReward: number;
}

interface Inventory {
  cobblestone: number;
  coal: number;
  iron: number;
  gold: number;
  diamond: number;
}

interface PickaxeTier {
  name: string;
  icon: string;
  power: number;
  costDesc: string;
  canBuy: (inv: Inventory) => boolean;
  buy: (inv: Inventory) => Inventory;
}

const ORES: OreType[] = [
  { name: "stone", block: block_stone, maxHp: 4, rewardIcon: cobblestone, rewardKey: "cobblestone", rewardName: "cobblestone", xpReward: 1 },
  { name: "coal ore", block: coal_ore, maxHp: 10, rewardIcon: coal, rewardKey: "coal", rewardName: "coal", xpReward: 2 },
  { name: "iron ore", block: iron_ore, maxHp: 20, rewardIcon: raw_iron, rewardKey: "iron", rewardName: "raw iron", xpReward: 4 },
  { name: "gold ore", block: gold_ore, maxHp: 40, rewardIcon: raw_gold, rewardKey: "gold", rewardName: "raw gold", xpReward: 7 },
  { name: "diamond ore", block: diamond_ore, maxHp: 80, rewardIcon: diamond, rewardKey: "diamond", rewardName: "diamond", xpReward: 15 },
];

const PICKAXES: PickaxeTier[] = [
  { name: "wooden pickaxe", icon: wooden_pickaxe, power: 1, costDesc: "default", canBuy: () => false, buy: (inv) => inv },
  {
    name: "stone pickaxe",
    icon: stone_pickaxe,
    power: 2,
    costDesc: "15 cobblestone",
    canBuy: (inv) => inv.cobblestone >= 15,
    buy: (inv) => ({ ...inv, cobblestone: inv.cobblestone - 15 }),
  },
  {
    name: "iron pickaxe",
    icon: iron_pickaxe,
    power: 4,
    costDesc: "10 iron",
    canBuy: (inv) => inv.iron >= 10,
    buy: (inv) => ({ ...inv, iron: inv.iron - 10 }),
  },
  {
    name: "golden pickaxe",
    icon: golden_pickaxe,
    power: 6,
    costDesc: "10 gold",
    canBuy: (inv) => inv.gold >= 10,
    buy: (inv) => ({ ...inv, gold: inv.gold - 10 }),
  },
  {
    name: "diamond pickaxe",
    icon: diamond_pickaxe,
    power: 10,
    costDesc: "8 diamonds",
    canBuy: (inv) => inv.diamond >= 8,
    buy: (inv) => ({ ...inv, diamond: inv.diamond - 8 }),
  },
  {
    name: "netherite pickaxe",
    icon: netherite_pickaxe,
    power: 20,
    costDesc: "15 diamonds + 15 gold",
    canBuy: (inv) => inv.diamond >= 15 && inv.gold >= 15,
    buy: (inv) => ({ ...inv, diamond: inv.diamond - 15, gold: inv.gold - 15 }),
  },
];

export default function MinecraftGame() {
  const [oreIndex, setOreIndex] = useState(0);
  const [hp, setHp] = useState(ORES[0].maxHp);
  const [pickaxeTier, setPickaxeTier] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [isMining, setIsMining] = useState(false);
  const [inventory, setInventory] = useState<Inventory>({
    cobblestone: 0,
    coal: 0,
    iron: 0,
    gold: 0,
    diamond: 0,
  });

  const playPop = usePlaySound(popSound);
  const playOrb = usePlaySound(orbSound);
  const playLevelup = usePlaySound(levelupSound);
  const playClick = usePlaySound(clickSound);

  const currentOre = ORES[oreIndex];
  const currentPick = PICKAXES[pickaxeTier];
  const nextPick = pickaxeTier < PICKAXES.length - 1 ? PICKAXES[pickaxeTier + 1] : null;

  // Handle clicking on block to mine
  const mineBlock = useCallback(() => {
    setIsMining(true);
    setTimeout(() => setIsMining(false), 80);

    // Play mine hit sound
    try {
      playClick.play({ volume: 0.4 });
    } catch (e) {
      console.warn(e);
    }

    const damage = currentPick.power;
    const newHp = Math.max(0, hp - damage);

    if (newHp <= 0) {
      // Ore broken! Give rewards
      try {
        playPop.play({ volume: 0.5 });
        playOrb.play({ volume: 0.4 });
      } catch (e) {
        console.warn(e);
      }

      // Add to inventory
      setInventory((prev) => ({
        ...prev,
        [currentOre.rewardKey]: prev[currentOre.rewardKey] + 1,
      }));

      // Add XP & check Level Up
      const newXp = xp + currentOre.xpReward;
      const xpNeeded = level * 10;
      if (newXp >= xpNeeded) {
        setXp(newXp - xpNeeded);
        setLevel((l) => l + 1);
        try {
          playLevelup.play({ volume: 0.5 });
        } catch (e) {
          console.warn(e);
        }
      } else {
        setXp(newXp);
      }

      // Move to next ore randomly or cycle
      const nextIndex = Math.floor(Math.random() * ORES.length);
      setOreIndex(nextIndex);
      setHp(ORES[nextIndex].maxHp);
    } else {
      setHp(newHp);
    }
  }, [hp, oreIndex, pickaxeTier, xp, level, currentOre, currentPick, playClick, playPop, playOrb, playLevelup]);

  // Upgrade pickaxe
  const upgradePickaxe = useCallback(() => {
    if (!nextPick) return;
    if (nextPick.canBuy(inventory)) {
      setInventory((prev) => nextPick.buy(prev));
      setPickaxeTier((tier) => tier + 1);
      try {
        playLevelup.play({ volume: 0.4 });
      } catch (e) {
        console.warn(e);
      }
    }
  }, [nextPick, inventory, playLevelup]);

  // Sell resources for XP
  const sellResources = useCallback(() => {
    let gainedXp = 0;
    gainedXp += inventory.cobblestone * 1;
    gainedXp += inventory.coal * 2;
    gainedXp += inventory.iron * 4;
    gainedXp += inventory.gold * 6;
    gainedXp += inventory.diamond * 15;

    if (gainedXp === 0) return;

    setInventory({
      cobblestone: 0,
      coal: 0,
      iron: 0,
      gold: 0,
      diamond: 0,
    });

    const newXp = xp + gainedXp;
    let currentLvl = level;
    let remainingXp = newXp;
    let xpNeeded = currentLvl * 10;

    while (remainingXp >= xpNeeded) {
      remainingXp -= xpNeeded;
      currentLvl += 1;
      xpNeeded = currentLvl * 10;
    }

    setXp(remainingXp);
    setLevel(currentLvl);

    try {
      playLevelup.play({ volume: 0.5 });
    } catch (e) {
      console.warn(e);
    }
  }, [inventory, xp, level, playLevelup]);

  const progressPercent = (hp / currentOre.maxHp) * 100;
  const xpNeeded = level * 10;

  return (
    <div className="border border-border/10 bg-secondary/15 dark:bg-card/25 rounded-sm p-4 font-mono text-xs max-w-xl space-y-4">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-border/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 font-bold">lvl {level}</span>
          {/* XP Bar */}
          <div className="w-24 h-2 bg-zinc-950/80 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(xp / xpNeeded) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{xp}/{xpNeeded} xp</span>
        </div>
        <span className="text-zinc-500">mine clicker</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-center">
        {/* Left Side: Clicker Area */}
        <div className="flex flex-col items-center justify-center p-3 border border-border/5 rounded-sm bg-zinc-900/40 relative">
          <button
            onClick={mineBlock}
            className={`w-24 h-24 flex items-center justify-center cursor-pointer outline-none select-none transition-all ${
              isMining ? "scale-90 rotate-3" : "hover:scale-105"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <MinecraftIcon
              src={currentOre.block}
              size={64}
              style={{ imageRendering: "pixelated" }}
            />
          </button>

          <div className="mt-4 w-full space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{currentOre.name}</span>
              <span>hp: {hp}/{currentOre.maxHp}</span>
            </div>
            {/* Health Bar */}
            <div className="w-full h-1.5 bg-zinc-950/80 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-100 ${
                  progressPercent > 50
                    ? "bg-emerald-500"
                    : progressPercent > 20
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Inv & Shop */}
        <div className="space-y-4">
          {/* Inventory */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">inventory</span>
            <div className="grid grid-cols-5 gap-1 bg-zinc-950/80 p-1.5 rounded-sm border border-zinc-850">
              <div className="flex flex-col items-center p-1 bg-zinc-900/40 border border-zinc-800 rounded-sm" title="cobblestone">
                <MinecraftIcon src={cobblestone} size={16} style={{ imageRendering: "pixelated" }} />
                <span className="text-[10px] mt-1 text-foreground/80">{inventory.cobblestone}</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-zinc-900/40 border border-zinc-800 rounded-sm" title="coal">
                <MinecraftIcon src={coal} size={16} style={{ imageRendering: "pixelated" }} />
                <span className="text-[10px] mt-1 text-foreground/80">{inventory.coal}</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-zinc-900/40 border border-zinc-800 rounded-sm" title="raw iron">
                <MinecraftIcon src={raw_iron} size={16} style={{ imageRendering: "pixelated" }} />
                <span className="text-[10px] mt-1 text-foreground/80">{inventory.iron}</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-zinc-900/40 border border-zinc-800 rounded-sm" title="raw gold">
                <MinecraftIcon src={raw_gold} size={16} style={{ imageRendering: "pixelated" }} />
                <span className="text-[10px] mt-1 text-foreground/80">{inventory.gold}</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-zinc-900/40 border border-zinc-800 rounded-sm" title="diamond">
                <MinecraftIcon src={diamond} size={16} style={{ imageRendering: "pixelated" }} />
                <span className="text-[10px] mt-1 text-foreground/80">{inventory.diamond}</span>
              </div>
            </div>
          </div>

          {/* Upgrades */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">equipment</span>
              <span className="text-[10px] text-primary/80">power: +{currentPick.power}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 border border-zinc-800 rounded-sm bg-zinc-900/20">
              <div className="flex items-center gap-2">
                <MinecraftIcon src={currentPick.icon} size={20} style={{ imageRendering: "pixelated" }} />
                <div>
                  <div className="text-[11px] font-bold text-foreground">{currentPick.name}</div>
                  <div className="text-[9px] text-zinc-500">upgrade: {nextPick ? nextPick.costDesc : "max level"}</div>
                </div>
              </div>
              
              {nextPick && (
                <button
                  onClick={upgradePickaxe}
                  disabled={!nextPick.canBuy(inventory)}
                  className="px-2 py-1 rounded-sm text-[10px] font-mono lowercase border transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent bg-foreground text-background hover:bg-primary hover:text-primary-foreground border-transparent disabled:cursor-not-allowed"
                >
                  upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sell Panel footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/5">
        <span className="text-[10px] text-muted-foreground">convert surplus blocks to level up</span>
        <button
          onClick={sellResources}
          className="px-2.5 py-1 border border-border bg-secondary/40 hover:bg-primary/20 hover:border-primary/40 rounded-sm text-[10px] transition-colors cursor-pointer"
        >
          sell inventory for xp
        </button>
      </div>
    </div>
  );
}
