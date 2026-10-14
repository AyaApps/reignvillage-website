(() => {
  const form = document.querySelector("#organizer-submission");
  if (!form) return;
  const send = document.querySelector("#submission-send"),
    status = document.querySelector("#submission-status");
  const received = document.querySelector("#submission-received");
  const otherZone = document.querySelector("#other-zone-field");
  const zoneSelect = form.querySelector?.('[name="timeZone"]');
  const updateZone = () => {
    if (!otherZone || !zoneSelect) return;
    otherZone.hidden = zoneSelect.value !== "other";
    otherZone.querySelector("input").required = !otherZone.hidden;
  };
  zoneSelect?.addEventListener("change", updateZone);
  updateZone();
  const flyerInput = form.querySelector?.('[name="flyerFile"]');
  const flyerDetails = document.querySelector("#flyer-details");
  const updateFlyer = () => {
    if (!flyerInput || !flyerDetails) return;
    const hasFlyer = !!flyerInput.files?.[0]?.size;
    flyerDetails.hidden = !hasFlyer;
    flyerDetails.querySelectorAll("input,textarea").forEach((field) => {
      field.required = hasFlyer;
      field.disabled = !hasFlyer;
    });
  };
  flyerInput?.addEventListener("change", updateFlyer);
  updateFlyer();
  let busy = false,
    token = "",
    pending = null,
    uncertain = false;
  window.submissionChallengeReady = (value) => {
    token = value;
    send.disabled = busy;
  };
  window.submissionChallengeExpired = () => {
    token = "";
    send.disabled = true;
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !token || !form.reportValidity()) return;
    busy = true;
    send.disabled = true;
    try {
    if (!pending) {
      const values = Object.fromEntries(new FormData(form));
      const { otherTimeZone, flyerFile, flyerDescription, flyerCredit, flyerPermission, "cf-turnstile-response": ignored, ...data } = values;
      let flyer;
      if (flyerFile?.size) {
        if (flyerFile.size > 4 * 1024 * 1024 || !["image/jpeg", "image/png"].includes(flyerFile.type))
          throw Error("Choose a JPEG or PNG flyer no larger than 4 MiB.");
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () => reject(Error("Could not read this flyer. Choose the file again."));
          reader.readAsDataURL(flyerFile);
        });
        flyer = {base64, description: flyerDescription,
          credit: (flyerCredit || data.organizerName).slice(0, 160), permission: flyerPermission === "on"};
      }
      data.timeZone = data.timeZone === "other" ? otherTimeZone : data.timeZone;
      data.countryCode = data.countryCode.trim().toUpperCase();
      data.state = data.state.trim().toUpperCase();
      pending = {
        ...data,
        ...(flyer ? {flyer} : {}),
        requestId: crypto.randomUUID(),
        venueAuthorized: values.venueAuthorized === "on",
        conductAccepted: values.conductAccepted === "on",
        policyVersion: "2026-10-11",
      };
    }
    } catch (error) {
      status.textContent = error.message;
      busy = false;
      send.disabled = !token;
      return;
    }
    form.querySelectorAll("fieldset").forEach((x) => (x.disabled = true));
    status.textContent = "Sending for review…";
    try {
      const reply = await fetch("/events/submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pending, token }),
        signal: AbortSignal.timeout(22000),
      });
      const result = await reply.json();
      if (reply.status === 202 && result.received) {
        status.textContent = result.message;
        form.querySelectorAll("fieldset,.cf-turnstile,button").forEach((x) => (x.hidden = true));
        if (received) {
          document.querySelector("#received-event-name").textContent = pending.name;
          form.hidden = true;
          received.hidden = false;
          document.querySelector("#received-heading").focus();
          received.scrollIntoView({block: "start"});
        }
        uncertain = false;
        pending = null;
        return;
      }
      uncertain = uncertain || reply.status >= 500;
      if (!uncertain) {
        pending = null;
        form.querySelectorAll("fieldset").forEach((x) => (x.disabled = false));
      }
      status.textContent = result.error || "Could not submit. Please try again.";
    } catch {
      uncertain = true;
      status.textContent = "Receipt is unconfirmed. Keep this page open and retry the same submission.";
    } finally {
      busy = false;
      token = "";
      send.disabled = true;
      send.textContent = uncertain ? "Retry same submission" : "Submit for review";
      if (!form.hidden) window.turnstile?.reset();
    }
  });
  window.addEventListener("beforeunload", (event) => {
    if (busy || uncertain) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
})();
