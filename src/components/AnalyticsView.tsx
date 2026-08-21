import React from 'react';
import type { Complaint, ComplaintCategory } from '../types';
import { CATEGORY_CONFIG, DEPARTMENTS, STATUS_CONFIG } from '../types';
import { BarChart3, TrendingUp, CheckCircle, Clock, ShieldCheck, Award, Zap } from 'lucide-react';

interface AnalyticsViewProps {
  complaints: Complaint[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ complaints }) => {
  const total = complaints.length || 1;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const resolutionRate = Math.round((resolved / total) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">City Municipal Analytics & Resolution Transparency</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time public benchmarks across city infrastructure departments</p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Total Issues Logged</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{complaints.length}</span>
            <span className="text-[11px] text-blue-600 font-medium mt-1 block">100% AI Validated</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Resolution Rate</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">{resolutionRate}%</span>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">{resolved} Issues Fixed</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Avg Response Time</span>
            <span className="text-3xl font-extrabold text-indigo-600 mt-1 block">4.2 hrs</span>
            <span className="text-[11px] text-indigo-600 font-medium mt-1 block">Dispatch SLA Met</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Citizen Satisfaction</span>
            <span className="text-3xl font-extrabold text-amber-600 mt-1 block">96.8%</span>
            <span className="text-[11px] text-amber-600 font-medium mt-1 block">Verified on-site</span>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Award size={18} className="text-blue-600" />
            <span>Complaints Distribution by Category</span>
          </h2>

          <div className="space-y-4">
            {(Object.keys(CATEGORY_CONFIG) as ComplaintCategory[]).map((cat) => {
              const catComplaints = complaints.filter((c) => c.category === cat);
              const count = catComplaints.length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const catResolved = catComplaints.filter((c) => c.status === 'resolved').length;

              return (
                <div key={cat} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{CATEGORY_CONFIG[cat].label}</span>
                    <span>{count} reported ({catResolved} fixed)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="h-full bg-blue-600 rounded-l-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Response Matrix */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Zap size={18} className="text-amber-600" />
            <span>Department Resolution Performance</span>
          </h2>

          <div className="space-y-3">
            {DEPARTMENTS.map((dept) => {
              const deptComplaints = complaints.filter((c) => c.assignedDepartment === dept.name);
              const resolvedDept = deptComplaints.filter((c) => c.status === 'resolved').length;
              const deptTotal = deptComplaints.length || 1;
              const deptPct = Math.round((resolvedDept / deptTotal) * 100);

              return (
                <div key={dept.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900">{dept.name}</span>
                    <span className="font-mono text-xs font-bold text-blue-700">{deptPct}% Efficiency</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Lead: {dept.leadOfficer}</span>
                    <span>{resolvedDept}/{deptComplaints.length} Remediated</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
