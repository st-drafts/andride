# And Ride Digits

Original display numerals for and Ride, version 1.0.

Five columns, flat rectangular ends, continuous vertical strokes, fixed-width digits. Includes 0–9, decimal comma and point, colon, plus, hyphen, em dash, and spacing. Letters and units fall back to Inter.

- `public/assets/AndRideDigits-Regular.woff2`: web font used for `.hero strong` and `.metric strong`.
- `public/assets/AndRideDigits-Regular.ttf`: installable desktop font.
- `design/digits.json`: editable rectangle geometry in a 1000-unit em.
- `scripts/build-digits-font.py`: reproducible build using fontTools and Brotli.

Figma uses matching native vector outlines for large numbers, with the original value text retained transparently beneath each outline. The font specimen is on the main design page. Updating a numeric value in Figma requires regenerating its outline or installing the TTF and switching the retained text to And Ride Digits.

Rebuild with Python 3 and the development packages `fonttools` and `brotli`: `python3 scripts/build-digits-font.py`. Regular application builds use the committed font files and do not require Python packages.
