# Night Walkability Survey Platform

Static research survey platform for the proposed night walkability methodology.

Current version: `v4_static_360_panorama`.

## Run Locally

With Node.js installed through `nvm`, use:

```bash
npm run dev
```

Then open `http://127.0.0.1:8000`.

To use another port:

```bash
PORT=8080 npm run dev
```

You can also run the static checks:

```bash
npm run check
```

The check command validates JSON files and runs JavaScript syntax checks with Node.

If Node is not available, Python still works as a fallback:

```bash
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

The survey flow is:

1. Welcome page
2. Anonymous general information
3. Training 360-degree scene
4. Pairwise comparison block
5. Detailed scene rating block
6. Ideal scene builder
7. Final realism check and optional comment
8. Thank-you page

The participant no longer chooses a method. This version follows one fixed path:

- one 360-degree training scene so participants can learn the viewer controls;
- pairwise comparison for controlled scene preferences;
- detailed 1-5 scene ratings for safety, comfort, visibility, obstacle detection, legibility, and route choice;
- ideal scene builder for preferred lighting, vegetation, openness, sidewalk, obstacle, and activity conditions;
- realism and final viewing-quality checks at the end.

The interface supports English and French. Participants choose the language on the welcome page, and the selected language is stored with each response row.

The survey is desktop-only. The browser blocks mobile/tablet-sized viewports and asks participants to use a computer or laptop with a desktop-sized browser window before starting or continuing. The anonymous profile also blocks continuation if the participant declares a device other than computer/laptop.

Batch classification remains in the code as a prototype helper, but it is not part of the proposed participant flow.

The active scenario dataset uses five 360-degree scenario groups, A-E, with three variants per group. Pairwise comparison uses a deterministic participant-based batch: each participant receives as many within-group pairs as there are pairwise questions, and each pair is shown with one question. Pair selection and Scene A/B placement are seeded by participant ID, so the assignment is reproducible while rotating scenario coverage across participants. For group D, `scenario_D_overview.png` is currently used as D1.

Detailed rating assigns one deterministic participant-based scenario panorama per detailed-rating question, without duplicates when enough scenario images are available.

## Configure Remote Saving

Responses are always backed up in `localStorage`.

To also submit each response to Google Sheets automatically:

1. Create a Google Sheet.
2. Open `Extensions` -> `Apps Script`.
3. Paste the survey Apps Script code into the editor.
4. Click `Deploy` -> `New deployment`.
5. Select type `Web app`.
6. Set `Execute as` to `Me`.
7. Set access to `Anyone`.
8. Deploy and copy the Web App URL.
9. Paste that URL into:

```js
// js/config.js
googleAppsScriptUrl: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
```

After that, answers are saved locally as each section is completed and sent to Google Sheets once, after the final realism section. There is no separate submit button.

The browser stores anonymous progress in versioned `localStorage` keys. If the same browser profile returns after completing the survey, the platform shows a completion warning before allowing the participant to redo the survey and replace the saved answers for the same participant ID.

The response shape follows the shared long-format schema in the project notes. The Google Sheet will use one row per answer.

Study/admin fields are included on each answer row:

- `participant_id`
- `language`
- `survey_completed_at`
- `survey_duration_ms`

For analysis consistency, `question_text` is always stored in English. The `language` column records whether the participant saw the interface in English or French.

Timing is stored at two levels: `reaction_time_ms` measures the time spent on each individual question/trial, while `survey_duration_ms` measures the full survey from the moment the participant starts the survey to final submission.

Anonymous profile fields are repeated on each answer row:

- `profile_age_range`
- `profile_gender`
- `profile_night_walk_frequency`
- `profile_place_familiarity`
- `profile_night_walking_comfort`
- `profile_screen_brightness`
- `profile_device_used`

Pairwise rows additionally include left/right placement fields:

- `image_left`
- `image_right`

Ideal-scene-builder rows include `preview_variant_id`.

The training-scene row includes `yaw_coverage_degrees`, which stores how much of the 360-degree panorama the participant covered before continuing.

The indicator table in `data/indicators.csv` is keyed by `image_id` and should match the IDs in `data/images.json`. Current indicator values are placeholders.

Final submissions replace previous rows for the same `participant_id`.

## Test Google Sheets Saving

Open your Web App URL directly in a browser. It should show JSON like:

```json
{"ok":true,"service":"night-walkability-survey"}
```

If Google shows `Access denied` or asks for permission, the deployment access is not public enough for survey participants.

Check these settings:

- Use `Deploy` -> `Manage deployments` -> edit the active Web App deployment.
- `Execute as`: `Me`.
- `Who has access`: `Anyone`.
- Use the `/exec` URL, not the `/dev` URL.
- After changing Apps Script code, click `Deploy` -> `Manage deployments` -> edit -> `New version` -> `Deploy`.

If your Google Workspace account blocks public web apps, deploy the script from a regular Google account or ask the Workspace admin to allow external access.
