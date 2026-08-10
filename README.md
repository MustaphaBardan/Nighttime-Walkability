# Night Walkability Survey Platform

Public V1 of the dependency-free, bilingual static survey used by the LUNNE night-walkability study.

The application presents simulated nocturnal urban panoramas and collects pairwise comparisons, detailed ratings, an optional preferred-scene configuration, realism feedback, and anonymous participant-profile information.

## Public V1 content

- 56 scenario panoramas: 16 in Scenario A, 8 in Scenario B, 24 in Scenario C, and 8 in Scenario D
- 2 synchronized route-continuation tutorial panoramas
- English and French interfaces
- deterministic, balanced scene assignment
- interactive WebGL panorama viewing with fullscreen and observation tracking
- local response backup and optional Google Sheets submission

Public panoramas are 4096×2048 WebP files. The two tutorial panoramas retain their native 2:1 resolution. Original 12288×6144 renders are intentionally excluded from Git.

## Install, run, and validate

Node.js 20.9 or newer is required for the development and image-preparation tools. The deployed website itself remains dependency-free static HTML, CSS, and JavaScript.

```bash
npm install
npm run dev
npm run check
```

The local server uses `http://127.0.0.1:8000`. Set `PORT=8080` to use another port.

To validate local source panoramas and rebuild the public WebP assets:

```bash
npm run assets:validate
npm run assets:prepare
```

Source panoramas belong under `assets/source-panoramas/scenario_A/` through `scenario_D/`. That directory is ignored because it contains the high-resolution originals. Public metadata and optimized images are generated from those sources.

## Participant flow

1. Introduction, project identities, and viewport check
2. Six anonymous profile questions
3. Synchronized readable/unreadable route tutorial
4. Six seeded pairwise comparisons
5. Six seeded detailed-scene ratings
6. Optional Scenario C preferred-scene builder
7. Realism, lighting plausibility, and viewing-quality questions
8. Local save, optional remote submission, and indicative personal summary

Assignments are deterministic for each participant ID. Panorama interaction records a compact yaw/pitch trace, rotation count, fullscreen state, viewing coverage, and timing for analysis.

## Response storage

Responses are backed up in versioned browser storage and submitted to the deployed Google Apps Script endpoint configured in `js/config.js`. Local Apps Script source and deployment files are intentionally excluded from the public repository.

## Credits

Some assets used to create the scenes were provided by L’Observatoire de la Nuit. The panorama simulations were produced using its Obscura software.

Additional third-party asset attributions are maintained in `data/credits.json` and displayed by the website. Credited assets retain their respective licences.

## Author and licence

Copyright © 2026 Mustapha Bardan.

The website software is distributed under the MIT License in `LICENSE`.
