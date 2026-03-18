/**
 * WF logo — white "WF" in upper portion + thin white horizontal line at bottom.
 * No background rect — the site's black canvas IS the background.
 * The text + line together imply a square without drawing one.
 *
 * Icon generation (scripts/generate-icons.js) maintains its own parallel SVG
 * strings because it's a plain CJS script that cannot import TypeScript.
 * If you change the geometry here, update the script too.
 */

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 48, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WaterHeaterVault"
      role="img"
    >
      <text
        x="50"
        y="42"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif"
        fontSize="38"
        fontWeight="500"
        fill="#ffffff"
        letterSpacing="-0.02em"
      >
        WH
      </text>
      <line
        x1="12"
        y1="82"
        x2="88"
        y2="82"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

