"use client"
import { useAccessibility } from "../hooks/useAccessibility"

export function AccessibilityMenu() {
  const { highContrast, fontSize, reducedMotion, toggleHighContrast, changeFontSize, toggleReducedMotion } =
    useAccessibility()

  return (
    <div className="accessibility-menu" role="region" aria-label="Accessibility Settings">
      <h2 className="text-lg font-semibold mb-4">Accessibility Settings</h2>

      <div className="space-y-4">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast" className="text-sm font-medium">
            High Contrast Mode
          </label>
          <button
            id="high-contrast"
            role="switch"
            aria-checked={highContrast}
            onClick={toggleHighContrast}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              highContrast ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span className="sr-only">Toggle high contrast mode</span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                highContrast ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-sm font-medium mb-2 block">Font Size</label>
          <div className="flex gap-2" role="radiogroup" aria-label="Font size options">
            {(["normal", "large", "xlarge"] as const).map((size) => (
              <button
                key={size}
                role="radio"
                aria-checked={fontSize === size}
                onClick={() => changeFontSize(size)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  fontSize === size ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {size === "normal" ? "Normal" : size === "large" ? "Large" : "Extra Large"}
              </button>
            ))}
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <label htmlFor="reduced-motion" className="text-sm font-medium">
            Reduce Motion
          </label>
          <button
            id="reduced-motion"
            role="switch"
            aria-checked={reducedMotion}
            onClick={toggleReducedMotion}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              reducedMotion ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span className="sr-only">Toggle reduced motion</span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                reducedMotion ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-900">
          <strong>Keyboard Navigation:</strong> Use Tab to navigate, Enter/Space to activate, and Escape to close
          dialogs.
        </p>
      </div>
    </div>
  )
}
