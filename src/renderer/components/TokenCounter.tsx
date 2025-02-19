import React from 'react'

interface TokenCounterProps {
  promptTokens: number
  responseTokens: number
  maxContext: number
}

export function TokenCounter({ promptTokens, responseTokens, maxContext }: TokenCounterProps) {
  const totalTokens = promptTokens + responseTokens
  const percentageUsed = Math.round((totalTokens / maxContext) * 100)
  
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
          />
        </svg>
        <span>
          {totalTokens.toLocaleString()} / {maxContext.toLocaleString()} tokens ({percentageUsed}%)
        </span>
      </div>
      <div className="h-1 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden group relative">
        <div 
          className={`h-full ${
            percentageUsed > 90 
              ? 'bg-red-500' 
              : percentageUsed > 75 
                ? 'bg-yellow-500' 
                : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
        />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {percentageUsed > 90 
            ? 'High usage: Consider starting a new chat'
            : percentageUsed > 75 
              ? 'Moderate usage: Approaching context limit'
              : 'Low usage: Plenty of context available'
          }
        </div>
      </div>
      <div className="flex gap-2">
        <div className="group relative">
          <span>🔵 {promptTokens.toLocaleString()}</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Prompt tokens (your input + conversation history)
          </div>
        </div>
        <div className="group relative">
          <span>🟣 {responseTokens.toLocaleString()}</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Response tokens (model's output)
          </div>
        </div>
      </div>
    </div>
  )
}
