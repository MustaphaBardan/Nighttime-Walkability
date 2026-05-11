import { CONFIG } from "./config.js";
import { buildBaseResponse } from "./storage.js";
import { TOTAL_SURVEY_STEPS, completeMethod } from "./survey-methods.js";
import { getContextLanguage, questionText, t } from "./i18n.js";
import { createElement, makePairs } from "./utils.js";

export function renderPairwiseComparison(root, context, onComplete) {
  const language = getContextLanguage(context);
  const methodId = "pairwise_comparison";
  const questions = context.questions.pairwise_comparison;
  const pairs = makePairs(context.images, CONFIG.pairwiseTrialCount);
  const trials = pairs.map((pair, index) => {
    const [first, second] = Math.random() > 0.5 ? pair : [pair[1], pair[0]];
    return {
      imageA: first,
      imageB: second,
      question: questions[index % questions.length],
      displayOrder: index + 1,
    };
  });

  let currentIndex = 0;
  let trialStartedAt = Date.now();
  const sessionResponses = [];

  function renderTrial() {
    if (currentIndex >= trials.length) {
      completeMethod(root, context, methodId, sessionResponses, onComplete);
      return;
    }

    const trial = trials[currentIndex];
    trialStartedAt = Date.now();
    root.innerHTML = "";

    const toolbar = createElement("section", { className: "toolbar" });
    const back = createElement("button", {
      className: "secondary-button",
      text: t(language, "back"),
      attrs: { type: "button" },
    });
    back.addEventListener("click", () => {
      if (currentIndex === 0) {
        renderProtocolIntro(root, context, onComplete);
        return;
      }

      currentIndex -= 1;
      sessionResponses.pop();
      renderTrial();
    });

    toolbar.append(
      createElement("div", {
        html: `<h2>${t(language, "pairwiseTitle")}</h2><p>${t(language, "pairwiseIntro")}</p>`,
      }),
      back,
      renderProgress(currentIndex, trials.length, language),
    );

    const panel = createElement("section", { className: "panel question-panel" });
    panel.append(createElement("div", { className: "question-text", text: questionText(trial.question, language) }));

    const pairGrid = createElement("div", { className: "pair-grid" });
    pairGrid.append(renderScene("A", trial.imageA, language), renderScene("B", trial.imageB, language));
    panel.append(pairGrid);

    const answerRow = createElement("div", { className: "answer-row" });
    answerRow.append(
      renderAnswerButton("A", "A"),
      renderAnswerButton("B", "B"),
      renderAnswerButton(t(language, "noClearDifference"), "no_clear_difference"),
    );
    panel.append(answerRow);

    const status = createElement("div", {
      className: "status-strip participant-status",
      attrs: { id: "save-status" },
      text: t(language, "savedAtEnd"),
    });

    root.append(toolbar, panel, status);
  }

  function renderAnswerButton(label, value) {
    const button = createElement("button", {
      className: "choice-button",
      text: label === "A" || label === "B" ? `${t(language, "scene")} ${label}` : label,
      attrs: { type: "button" },
    });

    button.addEventListener("click", async () => {
      const trial = trials[currentIndex];
      const response = buildBaseResponse(
        context.session,
        methodId,
        trial.question,
        trial.displayOrder,
        trialStartedAt,
      );

      response.image_A = trial.imageA.image_id;
      response.image_B = trial.imageB.image_id;
      response.answer = value;
      response.answer_value = value === "A" ? 1 : value === "B" ? 2 : 0;

      setButtonsDisabled(true);
      sessionResponses.push(response);
      currentIndex += 1;
      renderTrial();
    });

    return button;
  }

  function setButtonsDisabled(disabled) {
    document.querySelectorAll(".choice-button").forEach((button) => {
      button.disabled = disabled;
    });
  }

  renderTrial();
}

function renderProtocolIntro(root, context, onComplete) {
  const language = getContextLanguage(context);
  root.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  const start = createElement("button", {
    className: "primary-button",
    text: t(language, "pairwiseStart"),
    attrs: { type: "button" },
  });

  start.addEventListener("click", () => renderPairwiseComparison(root, context, onComplete));
  panel.append(
    createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 3, total: TOTAL_SURVEY_STEPS }) }),
    createElement("h2", { text: t(language, "pairwiseTitle") }),
    createElement("p", { text: t(language, "pairwiseIntroBody") }),
    createElement("div", { className: "completion-actions" }),
  );
  panel.querySelector(".completion-actions").append(start);
  root.append(panel);
}

function renderScene(label, image, language) {
  const wrapper = createElement("article", { className: "scene-option" });
  const frame = createElement("div", { className: "scene-frame" });
  const img = createElement("img", {
    attrs: {
      src: image.path,
      alt: `Survey scene ${label}`,
      loading: "eager",
    },
  });

  const footer = createElement("div", { className: "scene-footer" });
  footer.append(createElement("span", { className: "scene-label", text: `${t(language, "scene")} ${label}` }));

  frame.append(img);
  wrapper.append(frame, footer);
  return wrapper;
}

function renderProgress(currentIndex, total, language = "en") {
  const percent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;
  const wrapper = createElement("div", { className: "progress-wrap" });

  wrapper.innerHTML = `
    <div class="progress-label">
      <span>${t(language, "progress")}</span>
      <span>${currentIndex} / ${total}</span>
    </div>
    <div class="progress-bar" aria-hidden="true">
      <div class="progress-fill" style="width: ${percent}%"></div>
    </div>
  `;

  return wrapper;
}
