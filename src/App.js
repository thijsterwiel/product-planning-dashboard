import React from 'react';
import Dashboard from './components/Dashboard';
import zuruLogo from './assets/zuru-logo.png'; // Ensure this path is correct

function App() {
  return (
    <div className="App">
      <header className="bg-red-600 p-4 flex items-center justify-between">
        <img src={zuruLogo} alt="ZURU Logo" className="h-12" />
        <h1 className="text-white text-2xl font-bold">ZURU Product Planning</h1>
      </header>
      <main className="p-4">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;