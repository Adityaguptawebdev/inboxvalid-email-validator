/**
 * InboxValid.ai embeddable email validation widget. No build step required:
 *
 *   <input type="email" data-inboxvalid />
 *   <script src="/widget.js" data-api="/api/verify-email"></script>
 *
 * Duplicates the syntax regex and disposable list from src/utils/ since
 * this has to run standalone with no bundler — see README "Trade-offs".
 */
(function () {
  "use strict";

  var DEBOUNCE_MS = 120;
  var REQUEST_TIMEOUT_MS = 5000;

  var DISPOSABLE_DOMAINS = [
    "tempmail.com", "mailinator.com", "10minutemail.com", "guerrillamail.com",
    "yopmail.com", "throwawaymail.com", "trashmail.com", "getnada.com",
    "fakeinbox.com", "dispostable.com", "maildrop.cc", "sharklasers.com",
  ];

  var EMAIL_SYNTAX_REGEX =
    /^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  var STATE_COLORS = {
    idle: "#a8a29e",
    checking: "#d97706",
    valid: "#2b6142",
    invalid: "#dc2626",
    unreachable: "#b45309",
  };

  var currentScript = document.currentScript;
  var apiEndpoint = (currentScript && currentScript.getAttribute("data-api")) || "/api/verify-email";

  function isValidSyntax(email) {
    return EMAIL_SYNTAX_REGEX.test(email.trim());
  }

  function extractDomain(email) {
    var at = email.lastIndexOf("@");
    if (at === -1 || at === email.length - 1) return null;
    return email.slice(at + 1).toLowerCase();
  }

  function isDisposable(domain) {
    return DISPOSABLE_DOMAINS.indexOf(domain) !== -1;
  }

  function createStatusElement(input) {
    var el = document.createElement("p");
    el.setAttribute("data-inboxvalid-status", "");
    el.style.margin = "6px 0 0";
    el.style.fontSize = "13px";
    el.style.fontFamily = "system-ui, -apple-system, sans-serif";
    el.style.transition = "color 120ms ease";
    input.insertAdjacentElement("afterend", el);
    return el;
  }

  function render(input, statusEl, state, message) {
    statusEl.textContent = message;
    statusEl.style.color = STATE_COLORS[state] || STATE_COLORS.idle;
    statusEl.setAttribute("data-inboxvalid-state", state);
    input.setAttribute("data-inboxvalid-state", state);
  }

  function attach(input) {
    var statusEl = createStatusElement(input);
    var debounceTimer = null;
    var abortController = null;

    render(input, statusEl, "idle", "Enter your email address");

    input.addEventListener("input", function () {
      var value = input.value.trim();

      if (debounceTimer) clearTimeout(debounceTimer);
      if (abortController) abortController.abort();

      if (!value) {
        render(input, statusEl, "idle", "Enter your email address");
        return;
      }

      debounceTimer = setTimeout(function () {
        runValidation(value);
      }, DEBOUNCE_MS);
    });

    function runValidation(value) {
      // Layer 1: syntax — local, no network call.
      if (!isValidSyntax(value)) {
        render(input, statusEl, "invalid", "Please enter a valid email address.");
        return;
      }

      // Layer 2: disposable domain — local, no network call.
      var domain = extractDomain(value);
      if (domain && isDisposable(domain)) {
        render(input, statusEl, "invalid", "Disposable email addresses are not allowed.");
        return;
      }

      // Layer 3: mock MX plausibility check via the API.
      render(input, statusEl, "checking", "Checking email...");

      abortController = new AbortController();
      var timeoutId = setTimeout(function () {
        abortController.abort();
      }, REQUEST_TIMEOUT_MS);

      fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
        signal: abortController.signal,
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Verification request failed with status " + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          if (!data || (data.status !== "valid" && data.status !== "invalid")) {
            throw new Error("Verification API returned an unexpected response shape.");
          }
          if (data.status === "valid") {
            render(input, statusEl, "valid", "Email looks good!");
          } else {
            render(input, statusEl, "invalid", data.reason || "Email address was rejected.");
          }
        })
        .catch(function () {
          // Fail open: a network/API failure must never block the user.
          render(input, statusEl, "unreachable", "Unable to verify right now. You can continue.");
        })
        .finally(function () {
          clearTimeout(timeoutId);
        });
    }
  }

  function init() {
    var inputs = document.querySelectorAll("[data-inboxvalid]");
    for (var i = 0; i < inputs.length; i++) {
      attach(inputs[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
