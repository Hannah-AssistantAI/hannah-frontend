import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../service/api';
import type { ConfigSettings } from '../types';

export const useConfig = () => {
  const [config, setConfig] = useState<ConfigSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await apiService.getConfig();
      setConfig(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (section: keyof ConfigSettings, data: any) => {
    setSaving(true);
    try {
      await apiService.updateConfig(section, data);
      await fetchConfig(); // Refresh config after update
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update config' 
      };
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, error, saving, updateConfig, refresh: fetchConfig };
};