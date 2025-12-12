'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface JobAlert {
  id: string;
  email: string;
  companies: string[];
  locations: string[];
  keywords: string[];
  isActive: boolean;
  createdAt: string;
}

interface JobAlertsManagerProps {
  companies: string[];
}

export function JobAlertsManager({ companies }: JobAlertsManagerProps) {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [locations, setLocations] = useState('');
  const [keywords, setKeywords] = useState('');
  const [companySearch, setCompanySearch] = useState('');

  const filteredCompanies = companies.filter(c =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleCreateAlert = () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (selectedCompanies.length === 0 && !locations.trim() && !keywords.trim()) {
      alert('Please select at least one filter (company, location, or keyword)');
      return;
    }

    const newAlert: JobAlert = {
      id: Date.now().toString(),
      email: email.trim(),
      companies: selectedCompanies,
      locations: locations.trim() ? locations.split(',').map(l => l.trim()).filter(Boolean) : [],
      keywords: keywords.trim() ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setAlerts([...alerts, newAlert]);

    // Reset form
    setEmail('');
    setSelectedCompanies([]);
    setLocations('');
    setKeywords('');
    setCompanySearch('');
    setIsCreating(false);
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      setAlerts(alerts.filter(alert => alert.id !== id));
    }
  };

  const toggleCompany = (company: string) => {
    setSelectedCompanies(prev =>
      prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company]
    );
  };

  return (
    <div className="space-y-6">
      {/* Create New Alert Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white rounded-full border border-white/12 hover:border-white/20 text-[13px] font-medium transition-all duration-200 flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Alert
        </button>
      )}

      {/* Create Alert Form */}
      {isCreating && (
        <div className="p-6 bg-white/[0.02] rounded-xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">New Job Alert</h2>
            <button
              onClick={() => setIsCreating(false)}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-[13px] font-medium text-white/70 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2.5 bg-white/8 rounded-xl border border-white/12 text-white text-[14px] outline-none placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Companies Filter */}
          <div>
            <label className="block text-[13px] font-medium text-white/70 mb-2">
              Companies {selectedCompanies.length > 0 && (
                <span className="text-white/50">({selectedCompanies.length} selected)</span>
              )}
            </label>
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Search and select companies..."
              className="w-full px-4 py-2.5 bg-white/8 rounded-xl border border-white/12 text-white text-[13px] outline-none placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-all mb-2"
            />
            <div className="max-h-[150px] overflow-y-auto overscroll-contain space-y-1 border border-white/8 rounded-xl p-2">
              {filteredCompanies.length === 0 ? (
                <div className="text-[12px] text-white/50 text-center py-3">
                  No companies found
                </div>
              ) : (
                <>
                  {filteredCompanies.map((company) => (
                    <button
                      key={company}
                      onClick={() => toggleCompany(company)}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all uppercase',
                        selectedCompanies.includes(company)
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                      )}
                    >
                      {company}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Locations Input */}
          <div>
            <label className="block text-[13px] font-medium text-white/70 mb-2">
              Locations (comma-separated)
            </label>
            <input
              type="text"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="e.g., San Francisco, New York, Remote"
              className="w-full px-4 py-2.5 bg-white/8 rounded-xl border border-white/12 text-white text-[14px] outline-none placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-all"
            />
            <p className="text-[11px] text-white/40 mt-1">Enter city names, states, or "Remote" separated by commas</p>
          </div>

          {/* Keywords Input */}
          <div>
            <label className="block text-[13px] font-medium text-white/70 mb-2">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., React, Senior, Remote"
              className="w-full px-4 py-2.5 bg-white/8 rounded-xl border border-white/12 text-white text-[14px] outline-none placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreateAlert}
              className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white rounded-full border border-white/12 hover:border-white/20 text-[13px] font-medium transition-all"
            >
              Create Alert
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white/70 hover:text-white rounded-full border border-white/12 hover:border-white/20 text-[13px] font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[15px] font-semibold text-white/80">Your Alerts ({alerts.length})</h2>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={clsx(
                'p-5 rounded-xl border transition-all',
                alert.isActive
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-white/[0.01] border-white/5 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[14px] font-medium text-white/90">{alert.email}</span>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium',
                        alert.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/10 text-white/50 border border-white/10'
                      )}
                    >
                      {alert.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="text-[12px] text-white/50">
                    Created {new Date(alert.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className="px-3 py-1 bg-white/8 hover:bg-white/12 text-white rounded-full border border-white/12 hover:border-white/20 text-[11px] font-medium transition-all"
                  >
                    {alert.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="px-3 py-1 bg-white/8 hover:bg-red-500/20 text-white/70 hover:text-red-400 rounded-full border border-white/12 hover:border-red-500/30 text-[11px] font-medium transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Alert Criteria */}
              <div className="flex flex-wrap gap-1.5">
                {alert.companies.map((company) => (
                  <span
                    key={company}
                    className="px-2 py-0.5 bg-white/10 text-white/70 rounded-full text-[11px] border border-white/10 uppercase"
                  >
                    {company}
                  </span>
                ))}
                {alert.locations.map((location) => (
                  <span
                    key={location}
                    className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full text-[11px] border border-purple-500/20"
                  >
                    📍 {location}
                  </span>
                ))}
                {alert.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[11px] border border-blue-500/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/40"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h2 className="text-[18px] text-white/90 font-medium mb-2">No alerts yet</h2>
          <p className="text-[14px] text-white/60 mb-6 max-w-sm">
            Create your first job alert to get notified about new opportunities
          </p>
        </div>
      )}
    </div>
  );
}
