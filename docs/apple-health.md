# Apple Health bridge (1.06)

The PWA has no direct HealthKit access. On iPhone/iPad the user installs **and Ride Health** via the public iCloud link, returns to the app, and explicitly enables its switch. The shortcut asks iOS for permission when it first logs a workout. Android and desktop do not offer an enable control.

The first import route introduces this optional setup to new iOS users. Existing users can connect under More → Apple Health. Skipping setup leaves ordinary local FIT import available.

Only newly imported workouts after opt-in are queued. Restoring a backup does not enable Health or re-export history. A FIT import and its queue metadata commit in the same IndexedDB transaction. Re-importing an identical FIT cannot create a second queue item.

Each transfer exports cycling, the recorded start, timer duration in seconds, distance in metres and positive recorded FIT calories in kcal, when present. It does not export reconstructed calories, estimated power, heart-rate samples or GPS. Date/duration summarize the workout; timer pauses are not represented as Health events.

The app opens the documented `shortcuts://x-callback-url/run-shortcut` scheme with JSON input. After a successful Health action the shortcut outputs a receipt for the exact ride ID. Only a matching in-flight random token and that receipt confirm the transfer. Cancellation, errors or a lost callback require checking Health before retrying, because a Health write and browser state cannot form one atomic transaction. Safari may open callbacks outside the installed PWA; in that case return to the installed app and verify the queued workout manually. Browser restrictions can require a user tap to open Shortcuts. Multiple workouts remain queued for sequential transfer; the app never launches parallel shortcuts.

Disabling the integration stops further transfers and leaves Health records intact. Queue state is local and is intentionally absent from backups. Other apps may already have exported a ride; check Health to avoid duplicates from another source.

## Installation link

https://www.icloud.com/shortcuts/c0f472342afc4f059bfe7edc506c12c5

Safari/PWA downloads can append `.html` to the signed file. The primary install action now opens the Apple-hosted import page instead of downloading a file. The shared shortcut is named exactly `and Ride Health`; workflow file names can override its internal name during import. The published definition contains no workout data. Update the iCloud share when changing the shortcut.

## Shortcut maintenance

Generate with `python3 scripts/build-health-shortcut.py`, then on macOS:

```
shortcuts sign --mode anyone --input /private/tmp/and-ride-health-unsigned.shortcut --output public/shortcuts/and-ride-health.shortcut
```

Signing sends only the shortcut definition to Apple for validation, without workout data. Never run Health-writing actions as an automated QA test. The binary is an Apple-signed AEA archive; it must be regenerated and signed after changing the generator. The fixed shortcut name is part of the integration contract.

Reference: [Apple URL input](https://support.apple.com/guide/shortcuts/run-a-shortcut-from-a-url-apd624386f42/ios), [Apple callbacks](https://support.apple.com/guide/shortcuts/use-x-callback-url-apdcd7f20a6f/ios), [Apple signing](https://support.apple.com/guide/shortcuts-mac/run-shortcuts-from-the-command-line-apd455c82f02/mac).

QA covers payload validation, deduplication, matching receipts, canceled/failed transfers, enable/disable, simulated FIT import, localization and responsive screens. Recording in Health and device-specific URL switching require an actual iPhone/iPad check.
