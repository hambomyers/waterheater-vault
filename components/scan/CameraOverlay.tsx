/**
 * Camera Overlay Component - Guide for data plate scanning
 */

interface CameraOverlayProps {
  message?: string
}

export function CameraOverlay({ message = 'Center the data plate label' }: CameraOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Guide frame */}
      <div className="relative w-4/5 max-w-md aspect-video">
        <div className="absolute inset-0 rounded-2xl border-2 border-white/40" />
        
        {/* Corner markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
        
        {/* Message */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-sm text-white/80 bg-black/50 rounded-full px-4 py-2 inline-block">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
