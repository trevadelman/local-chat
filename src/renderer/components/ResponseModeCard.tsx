import React from 'react'

interface ResponseModeCardProps {
  mode: 'concise' | 'normal' | 'longform'
  selected?: boolean
  onClick?: () => void
}

const ResponseModeDetails = {
  concise: {
    title: 'Concise',
    description: 'Brief, direct answers focusing on key points',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  normal: {
    title: 'Normal',
    description: 'Balanced responses with explanations and examples',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    )
  },
  longform: {
    title: 'Longform',
    description: 'Detailed analysis with comprehensive context',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )
  }
}

export function ResponseModeCard({ mode, selected, onClick }: ResponseModeCardProps) {
  const details = ResponseModeDetails[mode]

  return (
    <div
      className={`border dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-600 dark:text-gray-400">
          {details.icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {details.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {details.description}
          </p>
        </div>
      </div>
    </div>
  )
}
