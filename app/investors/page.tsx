'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { mockInvestors, WarmthTier } from '../data/mockData';
import { InvestorCard } from '../components/InvestorCard';
import { InvestorProfile } from '../components/InvestorProfile';
import type { Investor } from '../data/mockData';

export default function InvestorsPage() {
  const router = useRouter();
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<WarmthTier | 'All'>('All');

  const filteredInvestors = useMemo(() => {
    return mockInvestors.filter((investor) => {
      const matchesSearch =
        searchQuery === '' ||
        investor.fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = filterTier === 'All' || investor.warmthTier === filterTier;

      return matchesSearch && matchesTier;
    });
  }, [searchQuery, filterTier]);

  const tierCounts = useMemo(() => {
    return {
      All: mockInvestors.length,
      Hot: mockInvestors.filter((i) => i.warmthTier === 'Hot').length,
      Warm: mockInvestors.filter((i) => i.warmthTier === 'Warm').length,
      Cold: mockInvestors.filter((i) => i.warmthTier === 'Cold').length,
      Stale: mockInvestors.filter((i) => i.warmthTier === 'Stale').length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Investor Intelligence</h1>
              <p className="text-sm text-gray-600 mt-1">Co-investor relationship intelligence</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search investors or funds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['All', 'Hot', 'Warm', 'Cold', 'Stale'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterTier === tier
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tier} ({tierCounts[tier]})
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredInvestors.length} of {mockInvestors.length} investors
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestors.map((investor) => (
            <InvestorCard
              key={investor.id}
              investor={investor}
              onClick={() => setSelectedInvestor(investor)}
            />
          ))}
        </div>

        {filteredInvestors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No investors found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {selectedInvestor && (
        <InvestorProfile
          investor={selectedInvestor}
          onClose={() => setSelectedInvestor(null)}
        />
      )}
    </div>
  );
}
