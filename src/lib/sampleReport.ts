const today = new Date().toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const SAMPLE_REPORT_TEXT = `THYROCARE TECHNOLOGIES LTD.
Diagnostic & Wellness Report
--------------------------------------------------
Patient Name : Priya Sharma
Age / Gender : 34 years / Female
Patient ID   : TC-2026-00184
Referred By  : Self
Sample Collected : ${today}
Report Released  : ${today}
--------------------------------------------------

COMPLETE BLOOD COUNT (CBC)
Test                       Result      Unit          Reference Range
Haemoglobin                10.8        g/dL          12.0 - 16.0     (LOW)
Total WBC Count            7200        cells/uL      4000 - 11000
Platelet Count             245000      /uL           150000 - 400000
MCV                        74.2        fL            80.0 - 100.0    (LOW)
MCH                        22.1        pg            27.0 - 32.0     (LOW)

LIVER FUNCTION TEST (LFT)
SGOT / AST                 52          U/L           10 - 40         (HIGH)
SGPT / ALT                 38          U/L           7 - 40
Total Bilirubin            0.9         mg/dL         0.2 - 1.2

THYROID PROFILE
TSH                        4.8         uIU/mL        0.4 - 4.0       (HIGH)

VITAMIN PANEL
Vitamin D (25-OH)          14.2        ng/mL         30 - 100        (LOW)

DIABETES SCREENING
HbA1c                      5.4         %             4.0 - 5.6

KIDNEY FUNCTION
Serum Creatinine           0.8         mg/dL         0.6 - 1.1

--------------------------------------------------
*** End of Report ***
This report is for informational purposes and should
be interpreted by a qualified medical professional.
`;
