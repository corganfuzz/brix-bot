

const PROXY_URL = 'http://localhost:3001/invoke-agent';

const fetchChatAPI = async (message) => {
  try {
    console.log('📤 Sending to proxy:', message);

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Proxy request failed');
    }

    const data = await response.json();

    console.log('📥 Proxy response:', data.response?.substring(0, 100) + '...');

    return data.response;

  } catch (error) {
    console.error('❌ Proxy call failed:', error);

    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to proxy server. Is it running?\nRun: node dev-proxy-server.js');
    }

    throw new Error(`Failed to call agent: ${error.message}`);
  }
};

export { fetchChatAPI };
