export function AuthHeroPanel(): JSX.Element {
  const features = [
    "Blood test analysis — every biomarker decoded",
    "Scan decoder — X-ray, CT, MRI, Ultrasound & more",
    "Zeno AI — your 24/7 personal health companion",
  ];

  return (
    <div className="h-full min-h-screen flex flex-col justify-between px-14 py-16 bg-[#0A0E1A]">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <svg width="32" height="32" viewBox="0 0 28 28" aria-hidden="true" className="text-[#00D9A3]">
          <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M3 14 H9 L11 9 L14 19 L17 12 L19 14 H25"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="text-white text-base font-semibold tracking-tight">ReportRx</span>
      </div>

      {/* Hero copy */}
      <div className="flex-1 flex flex-col justify-center max-w-md">
        <h1
          className="text-[38px] leading-[1.1] font-semibold text-white tracking-tight"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Understand your health, <span className="text-[#00D9A3]">finally.</span>
        </h1>
        <p className="mt-4 text-[15px] text-[#8B9BAE] leading-relaxed">
          Upload a lab report or imaging scan. Get plain-English explanations
          and the exact questions to ask your doctor — in under 30 seconds.
        </p>

        {/* Feature list */}
        <ul className="mt-8 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-[#C5D0DE]">
              <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-[#00D9A3]/15 flex items-center justify-center">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="#00D9A3"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Social proof */}
      <div className="border-t border-[#1E2D42] pt-6">
        <p className="text-xs text-[#56657a]">
          Built by a Double Gold Medallist, University of Madras · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}

export default AuthHeroPanel;
