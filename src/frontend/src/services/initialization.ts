/**
 * Service initialization for backend dependencies
 * Validates environment variables and ensures services are ready before app startup
 */

/**
 * Initialize all services required for the application
 * Validates environment variables and backend actor creation
 * Throws error if any critical dependencies are missing
 */
export const initializeServices = async (): Promise<void> => {
  // Validate required environment variables are available
  const requiredEnvVars = {
    CANISTER_ID_BACKEND: import.meta.env.VITE_CANISTER_ID_BACKEND,
    CANISTER_ID_INTERNET_IDENTITY: import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY,
    DFX_NETWORK: import.meta.env.VITE_DFX_NETWORK
  };

  // Check for missing environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value === 'undefined')
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing or undefined environment variables: ${missingVars.join(', ')}. Check your .env file and vite.config.ts configuration.`);
  }

  // Log environment status for debugging
  console.log('Environment variables validated:', {
    CANISTER_ID_BACKEND: import.meta.env.VITE_CANISTER_ID_BACKEND ? 'Available' : 'Missing',
    DFX_NETWORK: import.meta.env.VITE_DFX_NETWORK || 'Not set'
  });

  try {
    // Validate backend declarations can create actor
    const { backend } = await import('declarations/backend');

    if (!backend) {
      throw new Error('Backend actor could not be created. Check that CANISTER_ID_BACKEND is set correctly and the canister is deployed.');
    }

    console.log('Backend actor validation successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Backend actor validation failed: ${message}`);
  }

  // Add any other service initialization here as needed
  console.log('All services initialized successfully');
};

/**
 * Get the current status of service initialization
 * Used for debugging and monitoring
 */
export const getServiceStatus = () => {
  return {
    environmentVariables: {
      backend: !!import.meta.env.VITE_CANISTER_ID_BACKEND,
      internetIdentity: !!import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY,
      network: !!import.meta.env.VITE_DFX_NETWORK
    },
    timestamp: new Date().toISOString()
  };
};