// app/page.js
'use client';

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    phone: '',
    birthYear: '1990',
    birthMonth: '01',
    birthDay: '01'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateAccount = async () => {
    setIsGenerating(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: `Network Error: ${error.message}` });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
          Gmail Auto-Generator
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
          <input type="text" name="username" placeholder="Username (Gmail)" value={formData.username} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
          <input type="text" name="phone" placeholder="Phone (+1555...)" value={formData.phone} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
          
          {/* DOB Selects */}
          <select name="birthMonth" value={formData.birthMonth} onChange={handleChange} className="bg-gray-700 p-2 rounded">
            {Array.from({length: 12}, (_, i) => <option key={i} value={String(i+1).padStart(2, '0')}>{String(i+1).padStart(2, '0')}</option>)}
          </select>
          <select name="birthDay" value={formData.birthDay} onChange={handleChange} className="bg-gray-700 p-2 rounded">
            {Array.from({length: 31}, (_, i) => <option key={i} value={String(i+1).padStart(2, '0')}>{String(i+1).padStart(2, '0')}</option>)}
          </select>
          <select name="birthYear" value={formData.birthYear} onChange={handleChange} className="bg-gray-700 p-2 rounded">
            {Array.from({length: 60}, (_, i) => <option key={i} value={2024 - i}>{2024 - i}</option>)}
          </select>
        </div>

        <button 
          onClick={generateAccount} 
          disabled={isGenerating}
          className={`mt-6 w-full py-3 rounded-lg font-bold text-lg transition ${isGenerating ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isGenerating ? 'Generating... (This may take a while)' : 'Create Gmail Account'}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'}`}>
            <h3 className="font-bold mb-2">{result.success ? 'Success' : 'Error'}</h3>
            <p>{result.message}</p>
            {result.username && <p className="text-blue-300 font-mono">Email: {result.username}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
