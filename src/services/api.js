
const USE_LOCAL_PROXY = false;

const LOCAL_PROXY_URL = 'http://localhost:3001/invoke-agent';



const fetchChatAPI = async (message, sessionId = null) => {
  const url = USE_LOCAL_PROXY ? LOCAL_PROXY_URL : API_GATEWAY_URL;
  const mode = USE_LOCAL_PROXY ? 'LOCAL PROXY' : 'API GATEWAY';

  try {
    console.log(`📤 [${mode}] Sending:`, message);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (!USE_LOCAL_PROXY) {
      headers['x-api-key'] = API_KEY;
    }

    const body = { message };
    if (sessionId) {
      body.sessionId = sessionId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    const cacheStatus = response.headers.get('x-cache');
    const cacheAge = response.headers.get('x-cache-age-seconds');
    const cacheable = response.headers.get('x-cacheable');

    console.log(`📥 [${mode}] Response:`, data.response?.substring(0, 100) + '...');
    console.log('📚 Citations:', Object.keys(data.citations || {}).length, 'sources');
    console.log('📊 Has real-time data:', data.hasRealTimeData);

    if (cacheStatus) {
      console.log(`⚡ Cache: ${cacheStatus}${cacheAge ? ` (age: ${cacheAge}s)` : ''}, Cacheable: ${cacheable || 'N/A'}`);
    }

    return {
      response: data.response,
      citations: data.citations || {},
      hasRealTimeData: data.hasRealTimeData || false,
      cacheStatus: cacheStatus || null,
      cacheAge: cacheAge ? parseInt(cacheAge) : null
    };

  } catch (error) {
    console.error(`❌ [${mode}] Call failed:`, error);

    if (USE_LOCAL_PROXY && error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to local proxy server.\n\nMake sure it\'s running:\n  node dev-proxy-server.js');
    }

    if (!USE_LOCAL_PROXY && error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to API Gateway.\n\nCheck your internet connection.');
    }

    throw new Error(`Failed to call agent: ${error.message}`);
  }
};

export { fetchChatAPI };
