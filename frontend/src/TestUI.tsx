import React from 'react';
import ReactDOM from 'react-dom';
import InventoryHero from './views/account/inventory/hero';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

const theme = {};

const MockApp = () => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <div style={{ padding: '20px', background: '#121212', minHeight: '100vh', color: 'white' }}>
        <InventoryHero params={{ filter: 'all' }} />
      </div>
    </BrowserRouter>
  </ThemeProvider>
);

ReactDOM.render(<MockApp />, document.getElementById('root'));
