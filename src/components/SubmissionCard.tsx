import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { StudentSubmission } from '../types';
import { getCleanDomain, getCleanFallbackThumbnail } from '../utils/thumbnail';

interface SubmissionCardProps {
  submission: StudentSubmission;
  onOpenSlide: (sub: StudentSubmission) => void;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onOpenSlide,
}) => {
  const domain = getCleanDomain(submission.linkLamanWeb);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-zinc-300">
      {/* 1. Kotak Thumbnail Penghantar */}
      <div className="relative aspect-video bg-zinc-100 overflow-hidden border-b border-zinc-100">
        <img
          src={submission.thumbnailUrl}
          alt={submission.tajukWeb}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCleanFallbackThumbnail(submission.tajukWeb);
          }}
          className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Kandungan Kad */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* 2. Nama Pelajar */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="font-bold text-zinc-900 text-base leading-snug truncate">
              {submission.nama}
            </h3>
            {submission.noMatrik && (
              <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                {submission.noMatrik}
              </span>
            )}
          </div>

          {/* 3. Tajuk Web */}
          <p className="text-zinc-600 text-sm line-clamp-2 leading-relaxed">
            {submission.tajukWeb}
          </p>
        </div>

        {/* Baris Pautan */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
          {/* 4. Pautan Slaid */}
          <button
            onClick={() => onOpenSlide(submission)}
            aria-label={`Buka slaid ${submission.nama}`}
            className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-blue-600 font-medium py-1 px-2 rounded-md hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Pautan Slaid</span>
          </button>

          {/* 5. Pautan Laman Web */}
          <a
            href={submission.linkLamanWeb}
            target="_blank"
            rel="noreferrer"
            aria-label={`Buka laman web ${submission.nama}`}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium py-1 px-2 rounded-md hover:bg-blue-50 transition-colors"
          >
            <span className="truncate max-w-[130px]">{domain}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
