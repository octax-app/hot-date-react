import { JsParserEngine } from "./lib/parser/js-parser-engine";
import { normalizeInput } from "./lib/utils/string-utils";
import type {
  Candidate,
  CompletionSuggestion,
  ParseContext,
  ParseResult,
  ParseStatus,
  ValueKind,
} from "./lib/parser/parser-types";

const DEFAULT_PLACEHOLDER = "type anything...";

// Structural CSS required for the ghost overlay to work.
// No decorative styles — component renders as a plain browser input by default.
const FUNCTIONAL_STYLE = `
    :host { display: block; font: inherit; color: inherit; }
    .field { position: relative; display: block; width: 100%; }
    .input {
      font: inherit; color: inherit;
      width: 100%; box-sizing: border-box;
      border: 1px solid #cccccc50; border-radius: 4px;
      padding: 5px 4px;
      background: Field;
    }
    .ghost {
      position: absolute; inset: 0; display: flex; align-items: center;
      pointer-events: none; font: inherit;
      white-space: pre; overflow: hidden;
    }
    .ghost-completion { min-width: 0; overflow: hidden; white-space: pre; }
    .ghost-typed { color: transparent; }
    .ghost-tail { opacity: 0.5; }
    .ghost-hint {
      flex-shrink: 0; margin-left: 6px;
      padding: 0.05em 0.35em; border: 1px solid currentColor; border-radius: 3px;
      font-size: 0.7em; font-family: inherit; opacity: 0.5; background: transparent;
    }
    .ghost-hint[hidden] { display: none; }
    .ghost-resolution { opacity: 0.5; flex: 0 0 auto; margin-left: auto; }
    ::slotted([slot="ambiguity"][hidden]) { display: none; }
`;

const TEMPLATE_HTML = `
  <div class="field">
    <input class="input" part="input" type="text" autocomplete="off" spellcheck="false" />
    <div class="ghost" part="ghost" aria-live="polite"><span class="ghost-completion"><span class="ghost-typed" aria-hidden="true"></span><span class="ghost-tail"></span></span><span class="ghost-resolution"></span><kbd class="ghost-hint" part="hint" hidden>Tab</kbd></div>
  </div>
  <slot name="ambiguity"></slot>
`;

let _template: HTMLTemplateElement | null = null;
function getTemplate(): HTMLTemplateElement {
  if (!_template) {
    _template = document.createElement("template");
    _template.innerHTML = TEMPLATE_HTML;
  }
  return _template;
}

export class HotDateElement extends HTMLElement {
  public static formAssociated = true;

  public static get observedAttributes(): string[] {
    return [
      "class",
      "value",
      "timezone",
      "locale",
      "week-start",
      "mode",
      "allow-past",
      "placeholder",
      "name",
      "disabled",
      "required",
      "start-date",
      "end-date",
      "hide-hint",
      "display-value",
      "format",
      "part-class-input",
      "part-class-ghost",
      "part-class-hint",
    ];
  }

  private readonly parser = new JsParserEngine();
  private readonly internals: ElementInternals | null;
  private styleObserver: MutationObserver | null = null;
  private readonly inputElement: HTMLInputElement;
  private readonly ghostElement: HTMLDivElement;
  private readonly ghostTypedElement: HTMLSpanElement;
  private readonly ghostTailElement: HTMLSpanElement;
  private readonly ghostHintElement: HTMLElement;
  private readonly ghostResolutionElement: HTMLSpanElement;
  private readonly ambiguityElement: HTMLDivElement;

  private rawInputValue = "";
  private committedValue: string | null = null;
  private isDisplayMode = false;
  private parseState: ParseResult = this.createEmptyParseState();
  private activeSuggestionIndexValue = 0;
  private lastTabCompletedTo: string | null = null;

  public constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(getTemplate().content.cloneNode(true));

    const root = this.shadowRoot;

    if (!root) {
      throw new Error("Unable to create shadow root.");
    }

    this.inputElement = root.querySelector("input") ?? document.createElement("input");
    this.ghostElement =
      root.querySelector<HTMLDivElement>(".ghost") ?? document.createElement("div");
    this.ghostTypedElement =
      root.querySelector<HTMLSpanElement>(".ghost-typed") ?? document.createElement("span");
    this.ghostTailElement =
      root.querySelector<HTMLSpanElement>(".ghost-tail") ?? document.createElement("span");
    this.ghostHintElement =
      root.querySelector<HTMLElement>(".ghost-hint") ?? document.createElement("kbd");
    this.ghostResolutionElement =
      root.querySelector<HTMLSpanElement>(".ghost-resolution") ?? document.createElement("span");
    this.ambiguityElement = document.createElement("div");
    this.ambiguityElement.setAttribute("slot", "ambiguity");
    this.ambiguityElement.hidden = true;

    this.internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;

    this.bindEvents();
  }

  public connectedCallback(): void {
    if (this.ambiguityElement.parentNode !== this) {
      this.append(this.ambiguityElement);
    }
    this.updateStyles();
    this.syncExternalStyles();
    this.updateHintVisibility();
    this.syncInputPresentation();
    this.parseAndRender();

    if (!this.styleObserver) {
      this.styleObserver = new MutationObserver(() => this.syncExternalStyles());
      this.styleObserver.observe(document.head, { childList: true, subtree: true });
    }
  }

  public disconnectedCallback(): void {
    this.styleObserver?.disconnect();
    this.styleObserver = null;
  }

  public attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === "class") {
      this.applyPartClass(this.inputElement, oldValue, newValue);
      this.syncExternalStyles();
      return;
    }

    if (name === "placeholder") {
      this.inputElement.placeholder = newValue ?? DEFAULT_PLACEHOLDER;
      return;
    }

    if (name === "value") {
      this.committedValue = newValue;
      this.internals?.setFormValue(newValue ?? "");
      return;
    }

    if (name === "disabled") {
      this.inputElement.disabled = this.hasAttribute("disabled");
      return;
    }

    if (name === "hide-hint") {
      this.updateHintVisibility();
      return;
    }

    if (name === "display-value") {
      this.renderGhost();
      return;
    }

    if (name === "part-class-input") {
      this.applyPartClass(this.inputElement, oldValue, newValue);
      this.syncExternalStyles();
      return;
    }

    if (name === "part-class-ghost") {
      this.applyPartClass(this.ghostElement, oldValue, newValue);
      this.syncExternalStyles();
      return;
    }

    if (name === "part-class-hint") {
      this.applyPartClass(this.ghostHintElement, oldValue, newValue);
      this.syncExternalStyles();
      return;
    }

    this.parseAndRender();
  }

  public get rawInput(): string {
    return this.rawInputValue;
  }

  public set rawInput(nextValue: string) {
    this.rawInputValue = nextValue;
    this.syncInputPresentation();
    this.parseAndRender();
    this.emit("raw-input-change", { rawInput: this.rawInputValue });
  }

  public get value(): string | null {
    return this.committedValue;
  }

  public set value(nextValue: string | null) {
    this.committedValue = nextValue;

    if (nextValue === null) {
      this.removeAttribute("value");
      this.internals?.setFormValue("");
      return;
    }

    this.setAttribute("value", nextValue);
    this.internals?.setFormValue(nextValue);
  }

  public get valueKind(): ValueKind {
    return this.parseState.valueKind;
  }

  public get status(): ParseStatus {
    return this.parseState.status;
  }

  public get parseResult(): ParseResult {
    return this.parseState;
  }

  public get candidates(): Candidate[] {
    return this.parseState.candidates;
  }

  public get suggestions(): CompletionSuggestion[] {
    return this.parseState.suggestions;
  }

  public get activeSuggestionIndex(): number {
    return this.activeSuggestionIndexValue;
  }

  public focus(): void {
    this.inputElement.focus();
  }

  public forceDisplayMode(canonical: string | null): void {
    if (canonical) {
      this.isDisplayMode = true;
      this.inputElement.value = this.formatValue(canonical);
      this.ghostElement.hidden = true;
    } else {
      this.isDisplayMode = false;
      this.inputElement.value = this.rawInputValue;
      this.ghostElement.hidden = false;
      this.renderGhost();
    }
  }

  public clear(): void {
    this.isDisplayMode = false;
    this.ghostElement.hidden = false;
    this.rawInputValue = "";
    this.committedValue = null;
    this.removeAttribute("value");
    this.internals?.setFormValue("");
    this.activeSuggestionIndexValue = 0;
    this.syncInputPresentation();
    this.parseAndRender();
    this.emit("clear", {});
  }

  public confirm(): boolean {
    if (this.parseState.status !== "valid") {
      this.emit("commit-blocked", {
        reason: this.parseState.status === "ambiguous" ? "ambiguous" : "invalid",
      });
      return false;
    }

    const candidate = this.getSelectedCandidate();
    const canonicalValue = this.getCanonicalValue(candidate);

    if (!canonicalValue || !candidate) {
      this.emit("commit-blocked", { reason: "invalid" });
      return false;
    }

    this.committedValue = canonicalValue;
    this.setAttribute("value", canonicalValue);
    this.internals?.setFormValue(canonicalValue);
    this.internals?.setValidity({});

    this.emit("value-commit", {
      value: canonicalValue,
      valueKind: candidate.kind,
      rawInput: this.rawInputValue,
      candidate,
      timezone: this.buildContext().timezone,
    });

    return true;
  }

  public acceptSuggestion(index = this.activeSuggestionIndexValue): boolean {
    const suggestion = this.parseState.suggestions[index];

    if (!suggestion) {
      return false;
    }

    if (suggestion.insertText === normalizeInput(this.rawInputValue)) {
      return false;
    }

    this.rawInputValue = suggestion.insertText;
    this.activeSuggestionIndexValue = index;
    this.syncInputPresentation();
    this.emit("suggestion-accept", {
      suggestion,
      rawInput: this.rawInputValue,
    });
    this.emit("raw-input-change", { rawInput: this.rawInputValue });
    this.parseAndRender();

    return true;
  }

  public cycleSuggestion(direction: 1 | -1): void {
    if (!this.parseState.suggestions.length) {
      return;
    }

    const total = this.parseState.suggestions.length;
    this.activeSuggestionIndexValue = (this.activeSuggestionIndexValue + direction + total) % total;
    this.renderGhost();
    this.emit("suggestions-change", {
      suggestions: this.parseState.suggestions,
      activeSuggestionIndex: this.activeSuggestionIndexValue,
    });
  }

  public resolveAmbiguity(groupId: string, optionId: string): void {
    const group = this.parseState.ambiguityGroups.find((item) => item.id === groupId);
    const option = group?.options.find((item) => item.id === optionId);

    if (!group || !option) {
      return;
    }

    const candidate = this.parseState.candidates.find((item) => item.id === option.candidateId);

    if (!candidate) {
      return;
    }

    this.parseState = {
      ...this.parseState,
      status: "valid",
      selectedCandidateId: candidate.id,
      ambiguityGroups: [],
      previewLabel: candidate.label,
      canonicalValue: this.getCanonicalValue(candidate),
    };

    this.syncLiveValue();
    this.renderAll();

    this.emit("ambiguity-change", {
      groups: this.parseState.ambiguityGroups,
      unresolvedCount: this.parseState.ambiguityGroups.length,
    });
    this.emit("parse-change", {
      status: this.parseState.status,
      parseResult: this.parseState,
    });
  }

  public setContext(context: Partial<ParseContext>): void {
    if (context.timezone) {
      this.setAttribute("timezone", context.timezone);
    }

    if (context.locale) {
      this.setAttribute("locale", context.locale);
    }

    if (context.weekStart) {
      this.setAttribute("week-start", context.weekStart);
    }

    if (typeof context.productRules?.allowPast === "boolean") {
      this.toggleAttribute("allow-past", context.productRules.allowPast);
    }

    this.parseAndRender();
  }

  private applyPartClass(
    element: Element,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue) {
      oldValue.split(/\s+/).filter(Boolean).forEach((c) => element.classList.remove(c));
    }
    if (newValue) {
      newValue.split(/\s+/).filter(Boolean).forEach((c) => element.classList.add(c));
    }
  }

  private updateStyles(): void {
    if (!this.shadowRoot) return;

    if (!this.shadowRoot.querySelector("style.functional")) {
      const s = document.createElement("style");
      s.className = "functional";
      s.textContent = FUNCTIONAL_STYLE;
      this.shadowRoot.prepend(s);
    }
  }

  // Mirrors document stylesheets into the shadow root so external classes
  // (Tailwind, etc.) applied via classNames prop take effect inside shadow DOM.
  private syncExternalStyles(): void {
    if (!this.shadowRoot) return;

    // Some frameworks inject styles via adoptedStyleSheets
    try {
      if (document.adoptedStyleSheets.length > 0) {
        this.shadowRoot.adoptedStyleSheets = [...document.adoptedStyleSheets];
      }
    } catch {
      // adoptedStyleSheets not supported — fall through to link/style mirroring
    }

    // Mirror <link rel="stylesheet"> from document head (production CSS files)
    const existingLinks = new Set(
      Array.from(this.shadowRoot.querySelectorAll<HTMLLinkElement>("link[data-ext]")).map(
        (l) => l.href,
      ),
    );
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      .forEach((link) => {
        if (!existingLinks.has(link.href)) {
          const clone = document.createElement("link");
          clone.rel = "stylesheet";
          clone.href = link.href;
          clone.dataset.ext = "";
          this.shadowRoot!.append(clone);
        }
      });

    // Mirror <style> elements from document head (Vite dev mode: @tailwindcss/vite
    // injects styles as <style> tags, not adoptedStyleSheets).
    const srcStyles = Array.from(document.head.querySelectorAll<HTMLStyleElement>("style"));
    const dstStyles = Array.from(
      this.shadowRoot.querySelectorAll<HTMLStyleElement>("style[data-ext-style]"),
    );

    srcStyles.forEach((src, i) => {
      const content = src.textContent ?? "";
      if (dstStyles[i]) {
        if (dstStyles[i].textContent !== content) {
          dstStyles[i].textContent = content;
        }
      } else {
        const clone = document.createElement("style");
        clone.dataset.extStyle = "";
        clone.textContent = content;
        this.shadowRoot!.append(clone);
      }
    });

    for (let i = srcStyles.length; i < dstStyles.length; i++) {
      dstStyles[i].remove();
    }

    // Sync input's computed font + padding to ghost so ghost text aligns with
    // typed text even when the consumer overrides font-size or padding on ::part(input).
    requestAnimationFrame(() => {
      const s = window.getComputedStyle(this.inputElement);
      this.ghostElement.style.font = s.font;
      const leftOffset = (parseFloat(s.borderLeftWidth) || 0) + (parseFloat(s.paddingLeft) || 0);
      const rightOffset = (parseFloat(s.borderRightWidth) || 0) + (parseFloat(s.paddingRight) || 0);
      this.ghostElement.style.paddingLeft = `${leftOffset}px`;
      this.ghostElement.style.paddingRight = `${rightOffset}px`;
    });
  }

  private updateHintVisibility(): void {
    if (this.hasAttribute("hide-hint")) {
      this.ghostHintElement.hidden = true;
    }
  }

  private bindEvents(): void {
    this.inputElement.addEventListener("input", () => {
      this.rawInputValue = this.inputElement.value;
      if (this.lastTabCompletedTo !== null) {
        const normalized = normalizeInput(this.rawInputValue);
        if (!normalized || !this.lastTabCompletedTo.startsWith(normalized)) {
          this.lastTabCompletedTo = null;
        }
      }
      this.emit("raw-input-change", { rawInput: this.rawInputValue });
      this.parseAndRender();
    });

    this.inputElement.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.cycleSuggestion(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.cycleSuggestion(-1);
        return;
      }

      if (
        event.key === "Tab" &&
        !event.shiftKey &&
        this.isCaretAtInputEnd() &&
        this.hasCompletionTail()
      ) {
        const suggestion = this.parseState.suggestions[this.activeSuggestionIndexValue];
        if (suggestion && suggestion.insertText === this.lastTabCompletedTo) {
          // User already accepted and removed this completion — let Tab move focus
          return;
        }
        if (this.acceptSuggestion()) {
          this.lastTabCompletedTo = suggestion?.insertText ?? null;
          event.preventDefault();
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        this.confirm();
        return;
      }

      if (event.key === "Escape") {
        this.activeSuggestionIndexValue = 0;
        this.renderGhost();
      }
    });

    this.inputElement.addEventListener("blur", () => {
      this.lastTabCompletedTo = null;
      if (this.committedValue) {
        this.isDisplayMode = true;
        this.inputElement.value = this.formatValue(this.committedValue);
        this.ghostElement.hidden = true;
      }
    });

    this.inputElement.addEventListener("focus", () => {
      if (this.isDisplayMode) {
        this.isDisplayMode = false;
        this.inputElement.value = this.rawInputValue;
        this.ghostElement.hidden = false;
        this.renderGhost();
      }
    });
  }

  private parseAndRender(): void {
    this.parseState = this.parser.parse(this.rawInputValue, this.buildContext());
    this.activeSuggestionIndexValue = 0;

    this.syncLiveValue();
    this.renderAll();

    this.emit("parse-change", {
      status: this.parseState.status,
      parseResult: this.parseState,
    });

    this.emit("suggestions-change", {
      suggestions: this.parseState.suggestions,
      activeSuggestionIndex: this.activeSuggestionIndexValue,
    });

    this.emit("ambiguity-change", {
      groups: this.parseState.ambiguityGroups,
      unresolvedCount: this.parseState.ambiguityGroups.length,
    });

    this.syncValidity();
  }

  private renderAll(): void {
    this.renderGhost();
    this.renderAmbiguityChips();
  }

  private renderGhost(): void {
    this.ghostTypedElement.textContent = this.rawInputValue;
    const tail = this.computeCompletionTail();
    this.ghostTailElement.textContent = tail;
    this.ghostHintElement.hidden = tail.length === 0 || this.hasAttribute("hide-hint");

    if (this.parseState.status === "valid") {
      this.ghostResolutionElement.textContent = this.parseState.previewLabel ?? "";
    } else if (!this.rawInputValue) {
      this.ghostResolutionElement.textContent = this.getAttribute("display-value") ?? "";
    } else {
      this.ghostResolutionElement.textContent = "";
    }
  }

  private computeCompletionTail(): string {
    const normalized = normalizeInput(this.rawInputValue);
    const suggestion = this.parseState.suggestions[this.activeSuggestionIndexValue];

    if (!suggestion || !normalized) {
      return "";
    }

    if (!suggestion.insertText.startsWith(normalized) || suggestion.insertText === normalized) {
      return "";
    }

    return suggestion.insertText.slice(normalized.length);
  }

  private hasCompletionTail(): boolean {
    return this.computeCompletionTail().length > 0;
  }

  private renderAmbiguityChips(): void {
    this.ambiguityElement.replaceChildren();

    if (!this.parseState.ambiguityGroups.length) {
      this.ambiguityElement.hidden = true;
      return;
    }

    this.ambiguityElement.hidden = false;

    this.parseState.ambiguityGroups.forEach((group) => {
      group.options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option.label;
        button.addEventListener("click", () => {
          this.resolveAmbiguity(group.id, option.id);
        });
        this.ambiguityElement.append(button);
      });
    });
  }

  private syncInputPresentation(): void {
    if (this.isDisplayMode) return;
    if (this.inputElement.value !== this.rawInputValue) {
      this.inputElement.value = this.rawInputValue;
    }

    this.inputElement.placeholder = this.getAttribute("placeholder") ?? DEFAULT_PLACEHOLDER;
    this.inputElement.disabled = this.hasAttribute("disabled");
  }

  private createEmptyParseState(): ParseResult {
    return {
      status: "idle",
      rawInput: "",
      astType: null,
      valueKind: null,
      candidates: [],
      suggestions: [],
      ambiguityGroups: [],
      selectedCandidateId: null,
      previewLabel: null,
      canonicalValue: null,
      errors: [],
    };
  }

  private buildContext(): ParseContext {
    const rawMode = this.getAttribute("mode");
    const mode =
      rawMode === "point" || rawMode === "range" ? rawMode : ("any" as const);
    return {
      nowIso: new Date().toISOString(),
      timezone:
        this.getAttribute("timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
      locale: this.getAttribute("locale") ?? navigator.language ?? "en-US",
      weekStart: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(this.getAttribute("week-start") ?? '') ? this.getAttribute("week-start") as any : "monday",
      productRules: {
        allowPast: this.hasAttribute("allow-past"),
        defaultTime: { hour: 9, minute: 0 },
        timeOnlyPolicy: "today_if_future_else_tomorrow",
        startDate: this.getAttribute("start-date") ?? undefined,
        endDate: this.getAttribute("end-date") ?? undefined,
        mode,
      },
    };
  }

  private getSelectedCandidate(): Candidate | null {
    if (!this.parseState.candidates.length) {
      return null;
    }

    if (!this.parseState.selectedCandidateId) {
      return this.parseState.candidates[0] ?? null;
    }

    return (
      this.parseState.candidates.find(
        (candidate) => candidate.id === this.parseState.selectedCandidateId,
      ) ?? null
    );
  }

  private getCanonicalValue(candidate: Candidate | null): string | null {
    if (!candidate) {
      return null;
    }

    if (candidate.kind === "point") {
      return candidate.isoDate ?? null;
    }

    if (!candidate.range) {
      return null;
    }

    return `${candidate.range.startDate}/${candidate.range.endDate}`;
  }

  private isCaretAtInputEnd(): boolean {
    const caret = this.inputElement.selectionStart;
    return caret === this.inputElement.value.length;
  }

  private syncLiveValue(): void {
    const candidate = this.getSelectedCandidate();
    const canonicalValue =
      this.parseState.status === "valid" ? this.getCanonicalValue(candidate) : null;

    if (canonicalValue === this.committedValue) {
      return;
    }

    this.committedValue = canonicalValue;

    if (canonicalValue === null) {
      this.removeAttribute("value");
      this.internals?.setFormValue("");
    } else {
      this.setAttribute("value", canonicalValue);
      this.internals?.setFormValue(canonicalValue);
    }

    this.emit("value-change", {
      value: canonicalValue,
      valueKind: candidate?.kind ?? null,
      rawInput: this.rawInputValue,
      candidate,
    });
  }

  private syncValidity(): void {
    if (!this.internals) {
      return;
    }

    if (this.hasAttribute("required") && this.parseState.status !== "valid") {
      this.internals.setValidity(
        {
          customError: true,
        },
        "Please enter a valid date phrase.",
        this.inputElement,
      );
      return;
    }

    this.internals.setValidity({});
  }

  private formatSingleIso(isoDate: string, format: string): string {
    const [year, month, day] = isoDate.split("-");
    return format.replace(/YYYY|YY|MM|DD|M|D/gi, (token) => {
      switch (token.toUpperCase()) {
        case "YYYY": return year;
        case "YY":   return year.slice(-2);
        case "MM":   return month;
        case "M":    return String(parseInt(month, 10));
        case "DD":   return day;
        case "D":    return String(parseInt(day, 10));
        default:     return token;
      }
    });
  }

  private formatValue(canonical: string): string {
    const format = this.getAttribute("format");
    if (canonical.includes("/")) {
      const [start, end] = canonical.split("/");
      if (format) return `${this.formatSingleIso(start, format)} — ${this.formatSingleIso(end, format)}`;
      return `${start} — ${end}`;
    }
    return format ? this.formatSingleIso(canonical, format) : (this.parseState.previewLabel ?? canonical);
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }
}

if (!customElements.get("hot-date")) {
  customElements.define("hot-date", HotDateElement);
}
