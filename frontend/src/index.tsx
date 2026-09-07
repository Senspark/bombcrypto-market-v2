import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { normalizeResponse } from './utils/caseNormalizer';
import { rpcService } from './components/Service/rpcService';
import { isProduction } from './utils/config';

// Temporary: Support both snake_case and camelCase during backend migration
// TODO: Remove after migration complete
axios.interceptors.response.use((response) => {
  if (response.data) {
    response.data = normalizeResponse(response.data);
  }
  return response;
});

/**
 * We may not need await rpcService.initialize() here for the rpc init done
 * It can be use fallback value if user try to use rpc before the init done
 */
const bootstrap = async (): Promise<void> => {
  try {
    // rpcService only probes MAINNET RPC pools; on testnet it's unused
    // (getRpcByChainId uses the configured testnet RPC), so skip the probe
    // flood entirely.
    if (isProduction) {
      rpcService.initialize().then();
    }
  } catch (error) {
    console.error('[RPC] Bootstrap initialization failed:', error);
  }

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
};

void bootstrap();
