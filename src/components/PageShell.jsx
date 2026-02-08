import React from "react";

export default function PageShell({ title, subtitle, children }) {
  return (
    <div className="bg-slate-50">
      {/* Marketing pages: max-w-6xl. Workflow pages (Dashboard): max-w-7xl. */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-3xl">
                {subtitle}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
