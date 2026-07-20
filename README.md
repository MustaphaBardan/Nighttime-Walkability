# Night Walkability Survey Platform

Dependency-free bilingual static survey for the LUNNE night-walkability study.

Current version: `Protocol v6 - finalized static 360 panorama questionnaire`.

## Run and validate

```bash
npm run dev
npm run check
```

The local server uses `http://127.0.0.1:8000`. Set `PORT=8080` to use another port.

## Participant flow

1. LUNNE introduction, project identities, and 900×600 viewport check
2. Six anonymous profile questions
3. Combined D1/D3 panorama-control and route-continuation tutorial
4. Six seeded pairwise comparisons in fixed Q1–Q6 order
5. Six seeded detailed scenes in fixed Q1–Q6 order
6. Optional ideal-scene builder
7. Realism, lighting plausibility, and viewing-quality questions
8. Save, indicative personal summary, and finish

Each participant receives deterministic scene assignments based on their participant ID. Reloading preserves the same assignments; different participants generally receive different assignments. The six detailed scenes are unique when enough scenario images are available.

The panorama viewer permits pointer and keyboard rotation, limits pitch to ±50°, disables zoom, and never blocks an answer based on yaw coverage. It records a compact yaw/pitch trace, rotation-interaction count, fullscreen state, coverage, and timing for analysis.

## Data and privacy

Responses are backed up in versioned browser storage. Protocol v6 uses new keys and does not read, modify, or delete v5 data. The long-format response schema includes:

- participant, language, question, image, answer, display-order, and timing fields;
- age, gender, night-walking frequency and comfort, activity/expertise, and lighting knowledge;
- viewport resolution;
- yaw coverage, interaction availability, compact viewing trace, rotation-interaction count, fullscreen usage, and block time.

The ideal builder exports a participation row and, when completed, seven parameter rows. Final submissions replace prior rows for the same participant ID.

## Google Sheets deployment

The frontend submits the final response bundle to the Apps Script `/exec` URL configured in `js/config.js`. The matching local schema is in `google_apps_script/Code.gs`.

After changing the local script:

1. Copy it into the Google Sheet’s Apps Script editor.
2. Choose **Deploy → Manage deployments → Edit → New version → Deploy**.
3. Keep **Execute as: Me** and public access enabled.

The website cannot deploy that external Apps Script automatically.

## Credits

Project identities and asset attributions are loaded from `data/credits.json`. Public logo files live under `assets/logos/`. The website software is distributed under the root MIT `LICENSE`; credited 3D assets retain their respective CC BY 4.0 licences.
