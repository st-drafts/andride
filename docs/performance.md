# Rendering performance

Version 1.46 reuses numerical analysis for the same FIT object and relevant profile values. WeakMap entries retain only the latest variant: changing FTP, maximum heart rate, rider mass or bike mass invalidates the respective calculation. Replacing a ride on import, route edit or history refresh invalidates all its cached results. Do not mutate FIT objects in place or mutate returned results. Original readings, zero cadence and missing sensors are unchanged.

Overview shares one coachPlan between its goal story, history summary and schedule. History dates are formatted once per ride per calculation. Translation results are bounded to 4096 short strings; loading a language pack clears fallback results. DOM localization skips text and attributes only when both the current output and selected language match the previous pass.

Synthetic benchmark: 100,000 one-second records, ten repeat calculations on the same object, compared with published 1.45. Heart-rate zones averaged 3.46 ms before / 0.0081 ms after; power and energy 5.20 ms / 0.00125 ms. Numerical outputs were deep-equal. Timings are machine-specific and describe warm calculations, not total startup or first analysis latency.
