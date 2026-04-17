// src/components/common/ScoreBadge.jsx
import React, { memo } from 'react';
import { Award } from 'lucide-react';

const ScoreBadge = memo(({ score }) => {
  const pct = parseInt(score, 10);
  const cls = pct >= 80
    ? 'bg-green-100 text-green-700'
    : pct >= 60
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${cls}`}>
      <Award className="w-3.5 h-3.5" />
      {score || '0%'}
    </div>
  );
});

export default ScoreBadge;