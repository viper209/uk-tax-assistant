import React, { useState, useEffect } from 'react';
import { AlertCircle, Settings, Shield, Activity, Save, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const AdminPanel = () => {
  // State for current effective configuration
  const [currentConfig, setCurrentConfig] = useState(null);
  // State for loading indicators and status messages
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Form states for system configuration
  const [systemConfig, setSystemConfig] = useState({
    default_provider: 'bedrock',
    default_model: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
    fallback_provider: 'openai',
    fallback_model: 'gpt-4',
    allow_user_override: false, // This field was in the original but not used in JSX, keeping for data consistency
    maintenance_mode: false,
    cost_optimization: true,
    admin_notes: ''
  });

  // Form states for emergency override configuration
  const [emergencyConfig, setEmergencyConfig] = useState({
    emergency_mode: false,
    force_provider: 'bedrock',
    force_model: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
    message: ''
  });

  // State for dynamically loaded model options
  const [modelOptions, setModelOptions] = useState({
    bedrock: [], // Initialize as empty arrays
    openai: []
  });
  const [modelsLoading, setModelsLoading] = useState(false);
  const [lastModelUpdate, setLastModelUpdate] = useState(null);
  
  // Fallback models if dynamic loading fails or is empty
  const fallbackModelOptions = {
    bedrock: [
      { value: 'anthropic.claude-3-7-sonnet-20250219-v1:0', label: 'Claude 3.5 Sonnet' },
      { value: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku' },
      { value: 'amazon.titan-text-premier-v1:0', label: 'Amazon Titan Text Premier' }
    ],
    openai: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
    ]
  };

  // useEffect to load initial configuration and supported models on component mount
  useEffect(() => {
    loadConfiguration();
    loadSupportedModels();
  }, []);

  /**
   * Fetches the current system configuration and emergency override from the API.
   * Updates component states with the retrieved data and determines the effective configuration.
   */
  const loadConfiguration = async () => {
    setLoading(true); // Set loading state to true
    try {
      const response = await fetch('https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod/admin', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update form states with actual Parameter Store values
        setSystemConfig(data.system_config);
        setEmergencyConfig(data.admin_override);
        
        // Determine and set the effective current configuration based on emergency mode
        let effectiveConfig;
        if (data.admin_override.emergency_mode) {
          effectiveConfig = {
            source: 'emergency_override',
            provider: data.admin_override.force_provider,
            model: data.admin_override.force_model,
            system_controlled: true // In emergency mode, it's always system controlled
          };
        } else {
          effectiveConfig = {
            source: 'system_default',
            provider: data.system_config.default_provider,
            model: data.system_config.default_model,
            system_controlled: true // By default, system config is admin controlled
          };
        }
        
        setCurrentConfig(effectiveConfig);
        setStatus({ type: 'success', message: 'Configuration loaded successfully' });
      } else {
        setStatus({ type: 'error', message: `Failed to load configuration: ${data.error}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to load configuration: ${error.message}` });
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Fetches the list of supported models from the API.
   * Can force a refresh of the model list.
   * Uses fallback models if API call fails or returns no models.
   * @param {boolean} forceRefresh - If true, forces a refresh of the model list from the API.
   */
  const loadSupportedModels = async (forceRefresh = false) => {
    setModelsLoading(true); // Set models loading state
    try {
      const action = forceRefresh ? 'refresh_models' : 'get_supported_models';
      const response = await fetch('https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.models) {
        // Convert API format (object of objects) to dropdown format (array of {value, label})
        const formattedModels = {
          bedrock: Object.entries(data.models.bedrock || {}).map(([value, label]) => ({ value, label })),
          openai: Object.entries(data.models.openai || {}).map(([value, label]) => ({ value, label }))
        };
        
        setModelOptions(formattedModels);
        setLastModelUpdate(new Date()); // Record the last update time
        
        if (forceRefresh) {
          setStatus({ type: 'success', message: 'Model list refreshed successfully!' });
        }
      } else {
        // Use fallback models if API call is not successful or models are missing
        setModelOptions(fallbackModelOptions);
        setStatus({ type: 'warning', message: 'Using fallback model list - dynamic loading failed' });
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setModelOptions(fallbackModelOptions); // Use fallback on network error
      setStatus({ type: 'warning', message: 'Using fallback model list - API unavailable' });
    } finally {
      setModelsLoading(false); // Reset models loading state
    }
  };
  
  /**
   * Updates the system configuration via an API call.
   * Provides feedback on success or failure.
   */
  const updateSystemConfig = async () => {
    setSaving(true); // Set saving state
    try {
      setStatus({ type: 'info', message: 'Updating system configuration...' });
      
      const response = await fetch('https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_system_config',
          config: systemConfig
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update the displayed current configuration to reflect the new system config
        setCurrentConfig({
          source: 'system_default',
          provider: systemConfig.default_provider,
          model: systemConfig.default_model,
          system_controlled: true
        });

        setStatus({ 
          type: 'success', 
          message: 'System configuration updated successfully. Changes will take effect within 5 minutes.' 
        });
      } else {
        setStatus({ type: 'error', message: `Failed to update configuration: ${data.error}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to update configuration: ${error.message}` });
    } finally {
      setSaving(false); // Reset saving state
    }
  };

  /**
   * Toggles the emergency override mode and updates it via an API call.
   * Provides feedback and updates the displayed current configuration.
   */
  const toggleEmergencyMode = async () => {
    setSaving(true); // Set saving state
    try {
      setStatus({ type: 'info', message: 'Updating emergency override...' });
      
      const response = await fetch('https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_emergency_override',
          override: emergencyConfig // Send the current emergencyConfig state
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update the displayed current configuration based on the new emergency mode status
        if (emergencyConfig.emergency_mode) {
          setCurrentConfig({
            source: 'emergency_override',
            provider: emergencyConfig.force_provider,
            model: emergencyConfig.force_model,
            system_controlled: true
          });
          setStatus({ 
            type: 'warning', 
            message: 'Emergency mode activated! All requests will use the override configuration.' 
          });
        } else {
          // If emergency mode is deactivated, revert to displaying system default config
          setCurrentConfig({
            source: 'system_default',
            provider: systemConfig.default_provider,
            model: systemConfig.default_model,
            system_controlled: true
          });
          setStatus({ 
            type: 'success', 
            message: 'Emergency mode deactivated. System returned to normal operation.' 
          });
        }
      } else {
        setStatus({ type: 'error', message: `Failed to update emergency mode: ${data.error}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to update emergency mode: ${error.message}` });
    } finally {
      setSaving(false); // Reset saving state
    }
  };

  /**
   * Tests the currently active configuration via an API call.
   * Provides feedback on the test results, including provider, model, and confidence.
   */
  const testConfiguration = async () => {
    setStatus({ type: 'info', message: 'Testing current configuration...' });
    
    try {
      const response = await fetch('https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_configuration'
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setStatus({ 
          type: 'success', 
          message: `Configuration test successful! Provider: ${data.provider_used}, Model: ${data.model_used}, Confidence: ${(data.confidence * 100).toFixed(1)}%` 
        });
      } else {
        setStatus({ 
          type: 'error', 
          message: `Configuration test failed: ${data.error}` 
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Configuration test failed: ${error.message}` });
    }
  };

  /**
   * StatusAlert component for displaying various types of messages (success, error, warning, info).
   * @param {object} status - An object containing type (string) and message (string) for the alert.
   */
  const StatusAlert = ({ status }) => {
    if (!status) return null; // Don't render if no status is provided
    
    // Tailwind CSS classes for different alert types
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    // Lucide React icons for different alert types
    const icons = {
      success: <CheckCircle className="h-5 w-5" />,
      error: <XCircle className="h-5 w-5" />,
      warning: <AlertCircle className="h-5 w-5" />,
      info: <Activity className="h-5 w-5" />
    };
    
    return (
      <div className={`border rounded-lg p-4 mb-6 ${styles[status.type]}`}>
        <div className="flex items-center gap-3">
          {icons[status.type]} {/* Display appropriate icon */}
          <span className="font-medium">{status.message}</span> {/* Display status message */}
        </div>
      </div>
    );
  };

  // Show a loading skeleton while initial configuration is being fetched
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Main Admin Panel UI
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans">
      {/* Header Section */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          LLM Configuration Admin Panel
        </h1>
        <p className="text-gray-600 mt-2">
          Manage system-wide language model configuration for the UK Tax Assistant
        </p>
      </div>

      {/* Status Alert Display */}
      <StatusAlert status={status} />

      {/* Current System Status Overview Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Current System Status
        </h2>
        
        {currentConfig ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Configuration Source */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Configuration Source</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {currentConfig.source?.replace('_', ' ')}
              </div>
            </div>
            {/* Active Provider */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Active Provider</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {currentConfig.provider}
              </div>
            </div>
            {/* Active Model */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Active Model</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentConfig.model?.split('.').pop() || currentConfig.model}
              </div>
            </div>
            {/* Control Mode */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Control Mode</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentConfig.system_controlled ? 'Admin Controlled' : 'User Choice'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Configuration status unavailable</div>
        )}

        {/* Buttons for Current Status */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={loadConfiguration}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh Status
          </button>
          <button
            onClick={testConfiguration}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <Activity className="h-4 w-4" />
            Test Configuration
          </button>
        </div>
      </div>

      {/* Available Models Section (Moved to be a separate section) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          Available Models
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AWS Bedrock Models List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">AWS Bedrock Models</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto border border-gray-200">
              {modelOptions.bedrock.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {modelOptions.bedrock.map(model => (
                    <li key={model.value} className="text-gray-600">
                      {model.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">Loading models...</div>
              )}
            </div>
          </div>
          
          {/* OpenAI Models List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">OpenAI Models</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto border border-gray-200">
              {modelOptions.openai.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {modelOptions.openai.map(model => (
                    <li key={model.value} className="text-gray-600">
                      {model.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">Loading models...</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Last Model Update Timestamp */}
        {lastModelUpdate && (
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {lastModelUpdate.toLocaleString()}
          </div>
        )}

        {/* Button to refresh models */}
        <div className="mt-6">
          <button
            onClick={() => loadSupportedModels(true)}
            disabled={modelsLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md"
          >
            {modelsLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Refresh Models
          </button>
        </div>
      </div>

      {/* Configuration Forms Section (System Config & Emergency Override) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Configuration Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            System Configuration
          </h2>
          
          <div className="space-y-4">
            {/* Default Provider & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="default-provider" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Provider
                </label>
                <select
                  id="default-provider"
                  value={systemConfig.default_provider}
                  onChange={(e) => setSystemConfig(prev => ({...prev, default_provider: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="bedrock">AWS Bedrock</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="default-model" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Model
                </label>
                <select
                  id="default-model"
                  value={systemConfig.default_model}
                  onChange={(e) => setSystemConfig(prev => ({...prev, default_model: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {/* Render models based on the selected default provider */}
                  {modelOptions[systemConfig.default_provider]?.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fallback Provider & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fallback-provider" className="block text-sm font-medium text-gray-700 mb-2">
                  Fallback Provider
                </label>
                <select
                  id="fallback-provider"
                  value={systemConfig.fallback_provider}
                  onChange={(e) => setSystemConfig(prev => ({...prev, fallback_provider: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="bedrock">AWS Bedrock</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="fallback-model" className="block text-sm font-medium text-gray-700 mb-2">
                  Fallback Model
                </label>
                <select
                  id="fallback-model"
                  value={systemConfig.fallback_model}
                  onChange={(e) => setSystemConfig(prev => ({...prev, fallback_model: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {/* Render models based on the selected fallback provider */}
                  {modelOptions[systemConfig.fallback_provider]?.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3">
              <label htmlFor="maintenance-mode" className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="maintenance-mode"
                  checked={systemConfig.maintenance_mode}
                  onChange={(e) => setSystemConfig(prev => ({...prev, maintenance_mode: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">Maintenance Mode</span>
              </label>
              
              <label htmlFor="cost-optimization" className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="cost-optimization"
                  checked={systemConfig.cost_optimization}
                  onChange={(e) => setSystemConfig(prev => ({...prev, cost_optimization: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">Cost Optimization</span>
              </label>
            </div>

            {/* Admin Notes Textarea */}
            <div>
              <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>
              <textarea
                id="admin-notes"
                value={systemConfig.admin_notes}
                onChange={(e) => setSystemConfig(prev => ({...prev, admin_notes: e.target.value}))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about this configuration..."
              />
            </div>

            {/* Update System Configuration Button */}
            <button
              onClick={updateSystemConfig}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Update System Configuration
            </button>
          </div>
        </div>

        {/* Emergency Override Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Emergency Override
          </h2>
          
          <div className="space-y-4">
            {/* Emergency Mode Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Emergency Mode
              </div>
              <p className="text-red-700 text-sm">
                When enabled, this will override all system configurations and force all requests to use the specified model.
              </p>
            </div>

            {/* Activate Emergency Override Checkbox */}
            <label htmlFor="activate-emergency" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="activate-emergency"
                checked={emergencyConfig.emergency_mode}
                onChange={(e) => setEmergencyConfig(prev => ({...prev, emergency_mode: e.target.checked}))}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Activate Emergency Override
              </span>
            </label>

            {/* Conditional Emergency Override Settings */}
            {emergencyConfig.emergency_mode && (
              <div className="space-y-4 border-t pt-4">
                {/* Force Provider & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="force-provider" className="block text-sm font-medium text-gray-700 mb-2">
                      Force Provider
                    </label>
                    <select
                      id="force-provider"
                      value={emergencyConfig.force_provider}
                      onChange={(e) => setEmergencyConfig(prev => ({...prev, force_provider: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="bedrock">AWS Bedrock</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="force-model" className="block text-sm font-medium text-gray-700 mb-2">
                      Force Model
                    </label>
                    <select
                      id="force-model"
                      value={emergencyConfig.force_model}
                      onChange={(e) => setEmergencyConfig(prev => ({...prev, force_model: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      {/* Render models based on the selected force provider */}
                      {modelOptions[emergencyConfig.force_provider]?.map(model => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Emergency Message Input */}
                <div>
                  <label htmlFor="emergency-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Message
                  </label>
                  <input
                    type="text"
                    id="emergency-message"
                    value={emergencyConfig.message}
                    onChange={(e) => setEmergencyConfig(prev => ({...prev, message: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Reason for emergency override..."
                  />
                </div>
              </div>
            )}

            {/* Toggle Emergency Mode Button */}
            <button
              onClick={toggleEmergencyMode}
              disabled={saving}
              className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md ${
                emergencyConfig.emergency_mode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {emergencyConfig.emergency_mode ? 'Deactivate Emergency Mode' : 'Activate Emergency Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Usage Guidelines Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Usage Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong className="block mb-1">System Configuration:</strong>
            Changes take effect within 5 minutes due to caching. Use for planned model updates and cost optimization.
          </div>
          <div>
            <strong className="block mb-1">Emergency Override:</strong>
            Takes immediate effect. Use only for critical issues or urgent model switching requirements.
          </div>
          <div>
            <strong className="block mb-1">Testing:</strong>
            Always test configuration changes before deploying to production. Monitor response quality and costs.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
