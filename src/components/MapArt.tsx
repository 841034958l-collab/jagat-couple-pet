export function MapArt() {
  return (
    <svg
      className="map-art"
      viewBox="0 0 800 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="grass"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <rect width="32" height="32" fill="#e6ead6" />
          <circle cx="9" cy="12" r="1.2" fill="#ccd5b6" />
          <path d="M22 25l2-4 2 4" fill="none" stroke="#d2dbbf" />
        </pattern>
      </defs>
      <rect width="800" height="620" fill="url(#grass)" />
      <path
        d="M570 -30 Q455 140 565 255 T610 455 Q580 540 710 660"
        stroke="#a9d3d4"
        strokeWidth="96"
        fill="none"
      />
      <path
        d="M570 -30 Q455 140 565 255 T610 455 Q580 540 710 660"
        stroke="#c6e3dd"
        strokeWidth="70"
        fill="none"
      />
      <g stroke="#d5ceb5" strokeWidth="47" fill="none">
        <path d="M-20 205 Q210 180 375 215 T820 200" />
        <path d="M125 -20 Q175 210 150 360 T210 660" />
        <path d="M-10 452 Q230 390 400 450 T820 460" />
        <path d="M377 -20 L365 640" />
      </g>
      <g stroke="#faf5e7" strokeWidth="36" fill="none">
        <path d="M-20 205 Q210 180 375 215 T820 200" />
        <path d="M125 -20 Q175 210 150 360 T210 660" />
        <path d="M-10 452 Q230 390 400 450 T820 460" />
        <path d="M377 -20 L365 640" />
      </g>
      <path
        d="M505 199L606 203 M600 464L697 470"
        stroke="#bb956f"
        strokeWidth="45"
      />
      <path
        d="M505 199L606 203 M600 464L697 470"
        stroke="#e1bd8c"
        strokeWidth="34"
        strokeDasharray="5 5"
      />
      {[
        [60, 70],
        [290, 85],
        [445, 72],
        [710, 100],
        [700, 315],
        [440, 320],
        [70, 330],
        [265, 350],
        [82, 535],
        [440, 550],
        [750, 560],
        [300, 560],
        [650, 42],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cy="24" rx="23" ry="10" fill="#b7c49d" opacity=".4" />
          <path d="M0 2V28" stroke="#a48b64" strokeWidth="7" />
          <circle cy="-3" r="24" fill={i % 3 ? "#9fbc8a" : "#bdcda0"} />
          <circle cx="-8" cy="-8" r="15" fill="#b3cb98" />
        </g>
      ))}
      {[
        [233, 110, "#efcfba"],
        [270, 280, "#e5c2b4"],
        [470, 130, "#e4c998"],
        [75, 440, "#ddcfb3"],
        [450, 390, "#edcbb0"],
        [270, 500, "#d2d1b3"],
        [710, 235, "#e7c0a5"],
      ].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect
            x="-29"
            y="-22"
            width="60"
            height="52"
            rx="5"
            fill={c as string}
          />
          <path
            d="M-37 -20L0 -48 39 -20Z"
            fill={i % 2 ? "#bf9e87" : "#cbac88"}
          />
          <rect x="-8" y="6" width="15" height="24" rx="3" fill="#a88c74" />
          <rect x="13" y="-9" width="10" height="12" rx="2" fill="#fff0cd" />
        </g>
      ))}
      <g fill="#fff" opacity=".6">
        <path d="M20 115q20-35 45-8q35-12 38 14H20" />
        <path d="M640 540q20-35 45-8q35-12 38 14H640" />
      </g>
      <path
        d="M540 310q10-7 20 0m15 0q10-7 20 0M640 580q10-7 20 0"
        stroke="#94c1c4"
        fill="none"
        strokeWidth="3"
      />
    </svg>
  );
}
