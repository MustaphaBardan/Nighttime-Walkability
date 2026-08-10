import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import sharp from "sharp";

import {
  SCENARIO_ORDER,
  chooseScenarioCPreview,
  parseScenarioSourceFilename,
  validateScenarioCatalog,
} from "../js/scenario-protocol.js";

const SOURCE_ROOT = "assets/source-panoramas";
const SCENARIO_OUTPUT_ROOT = "assets/images/scenarios";
const TUTORIAL_OUTPUT_ROOT = "assets/images/tutorial";
const WEBP_OPTIONS = { quality: 88, effort: 6, smartSubsample: true };

const TUTORIALS = [
  {
    image_id: "tutorial_readable_route",
    source: `${SOURCE_ROOT}/tutorial/readable_route.png`,
    output: `${TUTORIAL_OUTPUT_ROOT}/readable_route.webp`,
    description: "Tutorial example with readable route continuity.",
  },
  {
    image_id: "tutorial_unreadable_route",
    source: `${SOURCE_ROOT}/tutorial/unreadable_route.png`,
    output: `${TUTORIAL_OUTPUT_ROOT}/unreadable_route.webp`,
    description: "Tutorial example with hidden or unreadable route continuity.",
  },
];

const command = process.argv[2] || "--prepare";

if (command === "--prepare") {
  await prepareAssets();
} else if (command === "--validate") {
  const sourceCatalog = collectSourceCatalog();
  assertCatalogReady(sourceCatalog.validation);
  await validateTutorialSources();
  console.log(formatReadinessMessage(sourceCatalog.validation));
} else {
  throw new Error(`Unknown panorama generation command: ${command}`);
}

async function prepareAssets() {
  const sourceCatalog = collectSourceCatalog();
  assertCatalogReady(sourceCatalog.validation);
  await validateTutorialSources();
  rmSync(SCENARIO_OUTPUT_ROOT, { recursive: true, force: true });
  rmSync(TUTORIAL_OUTPUT_ROOT, { recursive: true, force: true });
  mkdirSync(SCENARIO_OUTPUT_ROOT, { recursive: true });
  mkdirSync(TUTORIAL_OUTPUT_ROOT, { recursive: true });

  for (const image of sourceCatalog.images) {
    await generateWebp(image.local_source_path, image.path, 4096, 2048);
  }

  const tutorials = [];
  for (const tutorial of TUTORIALS) {
    const metadata = await sharp(tutorial.source).metadata();
    await generateWebp(tutorial.source, tutorial.output, metadata.width, metadata.height);
    tutorials.push({
      image_id: tutorial.image_id,
      role: "tutorial",
      path: tutorial.output,
      source_path: tutorial.output,
      width: metadata.width,
      height: metadata.height,
      format: "webp",
      view_type: "panorama_360",
      initial_yaw_degrees: 90,
      scenario_group: "tutorial",
      scenario_variant: 0,
      description: tutorial.description,
    });
  }

  const publicImages = sourceCatalog.images.map(({ local_source_path, ...image }) => image);
  const scenarioCVariants = publicImages.filter((image) => image.scenario_group === "C");
  writeJson("data/images.json", tutorials);
  writeJson("data/scenario_catalog.json", {
    protocol: "v1",
    validation: sourceCatalog.validation,
    images: publicImages,
  });
  writeJson("data/ideal_scene_variants.json", {
    mode: "scenario_c",
    default: chooseScenarioCPreview(scenarioCVariants),
    variants: scenarioCVariants,
  });
  console.log(formatReadinessMessage(sourceCatalog.validation));
}

function collectSourceCatalog() {
  const images = [];

  for (const scenarioGroup of SCENARIO_ORDER) {
    const sourceDirectory = join(SOURCE_ROOT, `scenario_${scenarioGroup}`);
    if (!existsSync(sourceDirectory)) continue;

    for (const filename of readdirSync(sourceDirectory).sort()) {
      const parsed = parseScenarioSourceFilename(scenarioGroup, filename);
      if (parsed.status === "excluded") continue;
      const normalizedName = `scenario_${scenarioGroup}_${parsed.variantKey}`;
      const outputPath = `${SCENARIO_OUTPUT_ROOT}/${normalizedName}.webp`;
      images.push({
        image_id: normalizedName,
        role: "scenario",
        path: outputPath,
        source_path: outputPath,
        width: 4096,
        height: 2048,
        format: "webp",
        view_type: "panorama_360",
        initial_yaw_degrees: 90,
        scenario_group: scenarioGroup,
        variant_key: parsed.variantKey,
        parameter_states: parsed.parameterStates,
        description: `Scenario ${scenarioGroup}, variant ${parsed.variantKey}.`,
        local_source_path: join(sourceDirectory, filename),
      });
    }
  }

  images.sort((left, right) => (
    left.scenario_group.localeCompare(right.scenario_group)
    || left.variant_key.localeCompare(right.variant_key)
  ));
  return { images, validation: validateScenarioCatalog(images) };
}

async function validateTutorialSources() {
  for (const tutorial of TUTORIALS) {
    if (!existsSync(tutorial.source)) {
      throw new Error(`Missing tutorial panorama: ${tutorial.source}`);
    }
    const metadata = await sharp(tutorial.source).metadata();
    if (!metadata.width || !metadata.height || metadata.width !== metadata.height * 2) {
      throw new Error(`Tutorial panorama must use a 2:1 aspect ratio: ${tutorial.source}`);
    }
  }
}

async function generateWebp(input, output, width, height) {
  await sharp(input)
    .resize(width, height, { fit: "fill" })
    .webp(WEBP_OPTIONS)
    .toFile(output);
  console.log(`Generated ${output} from ${basename(input)}`);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function assertCatalogReady(validation) {
  if (!validation.ready) {
    throw new Error(`Scenario catalog is incomplete. ${formatReadinessMessage(validation)}`);
  }
}

function formatReadinessMessage(validation) {
  return `Scenario counts: ${JSON.stringify(validation.counts)}; missing: ${validation.missing_scenarios.join(", ") || "none"}; unexpected: ${validation.unexpected_counts.join(", ") || "none"}.`;
}
