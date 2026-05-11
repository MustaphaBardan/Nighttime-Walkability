import { CONFIG } from "./config.js";
import { buildBaseResponse } from "./storage.js";
import { completeMethod } from "./survey-methods.js";
import { createElement, makePairs } from "./utils.js";

export function renderPairwiseComparison(root, context, onComplete) {
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
      text: "Back",
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
        html: "<h2>Pairwise comparison</h2><p>Choose the scene that better matches each question.</p>",
      }),
      back,
      renderProgress(currentIndex, trials.length),
    );

    const panel = createElement("section", { className: "panel question-panel" });
    panel.append(createElement("div", { className: "question-text", text: trial.question.text }));

    const pairGrid = createElement("div", { className: "pair-grid" });
    pairGrid.append(renderScene("A", trial.imageA), renderScene("B", trial.imageB));
    panel.append(pairGrid);

    const answerRow = createElement("div", { className: "answer-row" });
    answerRow.append(
      renderAnswerButton("A", "A"),
      renderAnswerButton("B", "B"),
      renderAnswerButton("No clear difference", "no_clear_difference"),
    );
    panel.append(answerRow);

    const status = createElement("div", {
      className: "status-strip participant-status",
      attrs: { id: "save-status" },
      text: "Your answers for this section are saved when the section is complete.",
    });

    root.append(toolbar, panel, status);
  }

  function renderAnswerButton(label, value) {
    const button = createElement("button", {
      className: "choice-button",
      text: label === "A" || label === "B" ? `Scene ${label}` : label,
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
  root.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  const start = createElement("button", {
    className: "primary-button",
    text: "Start pairwise comparison",
    attrs: { type: "button" },
  });

  start.addEventListener("click", () => renderPairwiseComparison(root, context, onComplete));
  panel.append(
    createElement("p", { className: "step-label", text: "Step 3" }),
    createElement("h2", { text: "Pairwise comparison" }),
    createElement("p", {
      text: "You will compare short pairs of simulated night scenes. Choose the scene that best matches each question.",
    }),
    createElement("div", { className: "completion-actions" }),
  );
  panel.querySelector(".completion-actions").append(start);
  root.append(panel);
}

function renderScene(label, image) {
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
  footer.append(createElement("span", { className: "scene-label", text: `Scene ${label}` }));

  frame.append(img);
  wrapper.append(frame, footer);
  return wrapper;
}

function renderProgress(currentIndex, total) {
  const percent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;
  const wrapper = createElement("div", { className: "progress-wrap" });

  wrapper.innerHTML = `
    <div class="progress-label">
      <span>Progress</span>
      <span>${currentIndex} / ${total}</span>
    </div>
    <div class="progress-bar" aria-hidden="true">
      <div class="progress-fill" style="width: ${percent}%"></div>
    </div>
  `;

  return wrapper;
}
