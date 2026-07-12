
interface SteveSpriteProps {
  className?: string;
  size?: number;
}

export default function SteveSprite({ className, size = 32 }: SteveSpriteProps) {
  // Steve 8x16 pixel grid
  // Colors:
  // H: Hair (brown: #4d2b12)
  // S: Skin (peach: #f3be98)
  // E: Eyes (white/blue: #ffffff / #3c5457)
  // B: Beard/Mouth (dark brown: #2e1a0b)
  // T: Torso (teal shirt: #00a3a3)
  // P: Pants (blue: #2a3a8c)
  // F: Feet (gray/brown shoes: #3a220f)
  
  const grid = [
    // Head
    ["H", "H", "H", "H", "H", "H", "H", "H"],
    ["H", "H", "H", "H", "H", "H", "H", "H"],
    ["H", "H", "S", "S", "S", "S", "H", "H"],
    ["S", "E", "S", "S", "S", "S", "E", "S"],
    ["S", "S", "S", "S", "S", "S", "S", "S"],
    ["S", "S", "B", "B", "B", "B", "S", "S"],
    ["S", "S", "S", "S", "S", "S", "S", "S"],
    ["S", "S", "S", "S", "S", "S", "S", "S"],
    // Torso
    ["T", "T", "T", "T", "T", "T", "T", "T"],
    ["T", "T", "T", "T", "T", "T", "T", "T"],
    ["T", "T", "T", "T", "T", "T", "T", "T"],
    ["T", "T", "T", "T", "T", "T", "T", "T"],
    // Legs
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    // Feet
    ["F", "F", "F", "F", "F", "F", "F", "F"]
  ];

  const colorMap: Record<string, string> = {
    H: "#4d2b12", // Hair
    S: "#f3be98", // Skin
    E: "#2a3a8c", // Eyes
    B: "#2e1a0b", // Beard/Mouth
    T: "#00a3a3", // Torso
    P: "#3e52b5", // Pants
    F: "#3a220f", // Feet
  };

  return (
    <svg 
      className={className}
      width={size} 
      height={size * 2} 
      viewBox="0 0 8 16" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {grid.map((row, rIdx) => 
        row.map((cell, cIdx) => (
          <rect 
            key={`${rIdx}-${cIdx}`} 
            x={cIdx} 
            y={rIdx} 
            width={1} 
            height={1} 
            fill={colorMap[cell]} 
          />
        ))
      )}
    </svg>
  );
}
