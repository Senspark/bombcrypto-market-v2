import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { normalizeResponse } from './utils/caseNormalizer';

// Temporary: Support both snake_case and camelCase during backend migration
// TODO: Remove after migration complete
axios.interceptors.response.use((response) => {
  if (response.data) {
    response.data = normalizeResponse(response.data);
  }
  return response;
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
