interface SloganWatermarkProps {
  visible?: boolean
}

export function SloganWatermark({ visible = true }: SloganWatermarkProps) {
  if (!visible) return null

  return <div className="ds-watermark text-3xl md:text-5xl text-white/80">Regarde-Investis-Gagne</div>
}
