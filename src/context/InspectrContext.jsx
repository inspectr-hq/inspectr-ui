// src/context/InspectrContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect
} from 'react';
import useLocalStorage from '../hooks/useLocalStorage.jsx';
import InspectrClient from '../utils/inspectrSdk';

// Create the context with default values
const InspectrContext = createContext({
  // Settings
  apiEndpoint: '/api',
  setApiEndpoint: () => {},

  // Connection status
  connectionStatus: 'reconnecting', // 'connected' | 'reconnecting' | 'disconnected'
  setConnectionStatus: () => {},

  // Registration details
  sseEndpoint: '',
  ingressEndpoint: '',
  channelCode: '',
  setChannelCode: () => {},
  channel: '',
  setChannel: () => {},
  token: '',

  // Refs
  reRegistrationFailedRef: { current: false },
  userInitiatedRegistrationRef: { current: false },

  // Registration functions
  handleRegister: () => {},
  attemptReRegistration: () => {},

  // Toast notifications
  toast: null,
  setToast: () => {},

  // Debug mode
  debugMode: false,

  // SDK client
  client: null
});

// Custom hook to use the context
export const useInspectr = () => useContext(InspectrContext);

// Provider component
export const InspectrProvider = ({ children }) => {
  // Settings state
  const [rawApiEndpoint, setRawApiEndpoint] = useLocalStorage('apiEndpoint', '/api');
  const apiEndpoint = rawApiEndpoint ? rawApiEndpoint.replace(/\/+$/, '') : '/api';
  const setApiEndpoint = (value) => {
    setRawApiEndpoint(value ? value.replace(/\/+$/, '') : value);
  };
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [sseEndpoint, setSseEndpoint] = useLocalStorage('sseEndpoint', '');
  const [ingressEndpoint, setIngressEndpoint] = useLocalStorage('ingressEndpoint', '');
  const [channelCode, setChannelCode] = useLocalStorage('channelCode', '');
  const [channel, setChannel] = useLocalStorage('channel', '');
  const [token, setToken] = useLocalStorage('token', '');
  const [expires, setExpires] = useLocalStorage('expires', '');
  const [, setExposeLocalStorage] = useLocalStorage('expose', 'false');
  const [isInitialized, setIsInitialized] = useState(false);
  const [toast, setToast] = useState(null);

  // SSE connection reference
  const registrationRetryCountRef = useRef(0);
  const reRegistrationFailedRef = useRef(false);
  const maxRegistrationRetries = 6;
  const retryDelay = 5000; // milliseconds

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('debug') === 'true';

  useEffect(() => {
    if (debugMode) {
      console.log('[Inspectr] Debug Mode enabled');
    }
  }, []);

  // Load credentials from URL query parameters
  const loadCredentialsFromQueryParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryChannelCode = urlParams.get('channelCode');
    const queryChannel = urlParams.get('channel');
    const queryToken = urlParams.get('token');
    const querySseEndpoint = urlParams.get('sseEndpoint');

    if (queryChannelCode || queryChannel || queryToken || querySseEndpoint) {
      console.log('🔍 Found credentials in query params');
      if (queryChannelCode) {
        setChannelCode(queryChannelCode);
      }
      if (queryChannel) {
        setChannel(queryChannel);
      }
      if (queryToken) {
        setToken(queryToken);
      }
      if (querySseEndpoint) {
        setSseEndpoint(querySseEndpoint);
      }
      // Update the URL without reloading the page.
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`
      );
      return true;
    }
    return false;
  };

  // Load credentials from local storage
  const loadCredentialsFromLocalStorage = () => {
    if (channelCode && channel && token) {
      console.log('✅ Using stored credentials from localStorage');
      return true;
    }
    return false;
  };

  // Proxy URL state (persisted)
  const [proxyEndpoint, setProxyEndpoint] = useLocalStorage('proxyEndpoint', '');

  // Create an InspectrClient instance
  const [inspectrClient, setInspectrClient] = useState(() => new InspectrClient({ apiEndpoint }));

  // Update the client when apiEndpoint changes
  useEffect(() => {
    inspectrClient.configure({ apiEndpoint });
  }, [apiEndpoint]);

  // Load credentials from REST API
  const loadCredentialsFromApi = async () => {
    console.log('🔄 Fetching /app/config (Localhost, No credentials found)');
    try {
      const result = await inspectrClient.registration.getConfig();
      if (result?.token && result?.sse_endpoint && result?.channel_code) {
        console.log('✅ Loaded from /app/config:', result);
        setChannelCode(result.channel_code);
        setChannel(result.channel);
        setToken(result.token);
        setSseEndpoint(result.sse_endpoint);
        setIngressEndpoint(result.ingress_endpoint);
        setProxyEndpoint(result.proxy_endpoint);
        setExposeLocalStorage(result.expose ? 'true' : 'false');
      }
    } catch (err) {
      console.error('❌ Failed to load /app/config:', err);
    }
  };

  // Registration handler.
  const handleRegister = async (
    newChannelCode = channelCode,
    newChannel = channel,
    newToken = token,
    showNotification
  ) => {
    try {
      // Construct request body
      let requestBody = {};
      if (newChannelCode && newChannel) {
        requestBody = { channel: newChannel, channel_code: newChannelCode };
      } else if (newToken) {
        requestBody = { token: newToken };
      }

      console.log('📤 Registering with:', requestBody);

      // Register App with Inspectr
      const result = await inspectrClient.registration.register(requestBody);

      if (result?.token && result?.sse_endpoint && result?.channel_code) {
        console.log('✅ Registration successful');
        registrationRetryCountRef.current = 0;
        reRegistrationFailedRef.current = false;

        setChannelCode(result.channel_code);
        setChannel(result.channel);
        setToken(result.token);
        setExpires(result.expires);
        setSseEndpoint(result.sse_endpoint);
        setIngressEndpoint(result.ingress_endpoint);
        setProxyEndpoint(result.proxy_endpoint);
        setExposeLocalStorage(result.expose ? 'true' : 'false');

        if (showNotification) {
          setToast({
            message: 'Registration Successful',
            subMessage: 'Your channel and access code have been registered.'
          });
        }
        // Update the connection status.
        setConnectionStatus('connected');
        return true;
      } else {
        console.error('❌ Registration failed:', result);
        setToast({
          message: 'Registration Failed',
          subMessage: 'Please check your channel and access code.',
          type: 'error'
        });
        setConnectionStatus('disconnected');
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setToast({
        message: 'Registration Error',
        subMessage: 'An error occurred during registration.',
        type: 'error'
      });
      setConnectionStatus('disconnected');
      throw error;
    }
  };

  const attemptReRegistration = () => {
    if (reRegistrationFailedRef.current) return;

    setConnectionStatus('reconnecting');
    if (registrationRetryCountRef.current < maxRegistrationRetries) {
      registrationRetryCountRef.current += 1;
      console.log(
        `🔄 Attempting re-registration (${registrationRetryCountRef.current}/${maxRegistrationRetries}) in ${
          retryDelay / 1000
        } seconds...`
      );
      setTimeout(async () => {
        try {
          await handleRegister();
        } catch (error) {
          console.log('❌ Re-registration attempt failed:', error);
          // Try again recursively.
          attemptReRegistration();
        }
      }, retryDelay);
    } else {
      console.log(`❌ Re-registration failed after ${maxRegistrationRetries} attempts. Giving up.`);
      registrationRetryCountRef.current = 0;
      reRegistrationFailedRef.current = true; // Prevent further attempts
      // Set final connection status to "disconnected"
      setConnectionStatus('disconnected');
    }
  };

  const resetReRegistration = () => {
    registrationRetryCountRef.current = 0;
    reRegistrationFailedRef.current = false;
  };

  /**
   * 🏁 Step 1: Load credentials from localStorage on mount
   */
  useEffect(() => {
    const loadCredentials = async () => {
      if (typeof window === 'undefined') return;

      if (!loadCredentialsFromQueryParams()) {
        if (!loadCredentialsFromLocalStorage() && isLocalhost) {
          await loadCredentialsFromApi();
        }
      }

      setIsInitialized(true);
    };

    loadCredentials();
  }, []);

  /**
   * 🏁 Step 2: When `isInitialized` is true, register using stored credentials
   * We use a ref to track if registration was triggered by the user to avoid loops
   */
  const userInitiatedRegistrationRef = useRef(false);

  useEffect(() => {
    if (!isInitialized) return;

    // Skip auto-registration if it was triggered by the user via SettingsPanel
    if (userInitiatedRegistrationRef.current) {
      userInitiatedRegistrationRef.current = false;
      return;
    }

    // Skip if we already have a token and sseEndpoint (already registered)
    // if (token && sseEndpoint) {
    //   console.log('🔄 Already have a token and sseEndpoint, skipping auto-registration');
    //   return;
    // }

    // If we have a token but no sseEndpoint, we need to re-register
    if (token && !sseEndpoint && !reRegistrationFailedRef.current) {
      console.log('🔄 Have token but missing sseEndpoint, re-registering');
      handleRegister('', '', token);
      return;
    }

    console.log('🔄 Auto-registering with stored credentials:', channel, channelCode);

    if (channel && channelCode) {
      handleRegister(channelCode, channel);
    } else {
      console.log('⚠️ Missing credentials for auto-registration, skipping.');
    }
  }, [isInitialized, channel, channelCode, token, sseEndpoint]);

  // Context value
  const contextValue = {
    apiEndpoint,
    setApiEndpoint,
    connectionStatus,
    setConnectionStatus,
    sseEndpoint,
    ingressEndpoint,
    proxyEndpoint,
    setProxyEndpoint,
    channelCode,
    setChannelCode,
    channel,
    setChannel,
    token,
    reRegistrationFailedRef,
    userInitiatedRegistrationRef,
    handleRegister,
    attemptReRegistration,
    resetReRegistration,
    toast,
    setToast,
    debugMode,
    client: inspectrClient
  };

  return <InspectrContext.Provider value={contextValue}>{children}</InspectrContext.Provider>;
};

export default InspectrContext;
