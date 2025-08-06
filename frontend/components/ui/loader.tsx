import React from "react";

interface CircularLoaderProps {
  size?: number;       // Diameter in pixels
  color?: string;      // Stroke color
  speed?: number;      // Animation speed in seconds
  thickness?: number;  // Stroke width
}

const Loader: React.FC<CircularLoaderProps> = ({
  size = 48,
  color = "#ffffffff",
  speed = 1.2,
  thickness = 4,
}) => (
    <div className="flex flex-row gap-3 w-fit h-fit">
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{
                display: "block",
                animation: `circ-spin ${speed}s linear infinite`,
            }}
        >
            <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - thickness) / 2}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={Math.PI * (size - thickness)}
            strokeDashoffset={Math.PI * (size - thickness) * 0.25}
            strokeLinecap="round"
            />
            <style>{`
            @keyframes circ-spin {
                100% {
                    transform: rotate(360deg);
                    }
                    }
                    `}</style>
        </svg>
        <p>
            Loading...
        </p>
    </div>
);

export default Loader;
