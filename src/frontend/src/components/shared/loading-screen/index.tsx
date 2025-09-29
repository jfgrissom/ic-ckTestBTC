import React from 'react'
import type { LoadingScreenProps } from './types'

/**
 * LoadingScreen component for displaying app initialization states
 * Shows loading animation while services initialize, or error state with retry option
 * Based on the gifty-crypto platform implementation
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 font-sans flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white text-shadow-lg">
          ckTestBTC Wallet
        </h1>
        <div className="flex items-center justify-center">
          {error !== null && error !== undefined ? (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-lg p-6 max-w-md shadow-xl">
              <h2 className="text-lg font-semibold text-red-100 mb-2">
                Initialization Failed
              </h2>
              <p className="text-red-200 mb-4 text-sm">
                {error}
              </p>
              <button
                onClick={onRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">
                Initializing Services...
              </h2>
              <p className="text-white/80 text-sm mb-4">
                Setting up Internet Identity and backend connections...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
export type { LoadingScreenProps } from './types'