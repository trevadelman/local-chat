import React from 'react'
import { OllamaModel } from '../types'

interface ModelCardProps {
  model: OllamaModel
  selected?: boolean
  onClick?: () => void
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function ModelCard({ model, selected, onClick }: ModelCardProps) {
  return (
    <div
      className={`border dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <h3 className="font-medium text-gray-900 dark:text-white">
        {model.name}
      </h3>
      <div className="mt-1 space-y-1">
        {model.details.parameter_size && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Parameters: {model.details.parameter_size}
          </p>
        )}
        {model.details.quantization_level && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quantization: {model.details.quantization_level}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Size: {formatBytes(model.size)}
        </p>
      </div>
    </div>
  )
}
