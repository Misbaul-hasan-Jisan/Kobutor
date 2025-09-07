import { useMemo } from "react";

function FlyingPigeon({ color = "white", delay = 0, top = "20vh", size = 40 }) {
  const pigeonColor = {
    white: "bg-white",
    black: "bg-gray-800",
    brown: "bg-amber-700",
  };

  // Slight random tilt & flight duration for variety
  const randomTilt = useMemo(() => Math.random() * 20 - 10, []);
  const randomDuration = useMemo(() => 8 + Math.random() * 5, []);

  return (
    <div
      className="absolute"
      style={{
        top,
        animation: `flyAcross ${randomDuration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Body */}
      <div
        className={`relative rounded-full ${pigeonColor[color]}`}
        style={{
          width: size,
          height: size * 0.7,
          transform: `rotate(${randomTilt}deg)`,
          boxShadow: "0 0 6px rgba(0,0,0,0.25)",
        }}
      >
        {/* Head */}
        <div
          className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full ${pigeonColor[color]}`}
          style={{ width: size * 0.35, height: size * 0.35 }}
        />
        {/* Wing Left */}
        <div
          className={`absolute -left-3 top-1/2 -translate-y-1/2 rounded-full ${pigeonColor[color]}`}
          style={{
            width: size * 0.6,
            height: size * 0.4,
            animation: "flap 1s ease-in-out infinite alternate",
            transformOrigin: "right center",
          }}
        />
        {/* Wing Right */}
        <div
          className={`absolute -right-3 top-1/2 -translate-y-1/2 rounded-full ${pigeonColor[color]}`}
          style={{
            width: size * 0.6,
            height: size * 0.4,
            animation: "flap 1s ease-in-out infinite alternate",
            transformOrigin: "left center",
          }}
        />
      </div>
    </div>
  );
}

export default FlyingPigeon;
