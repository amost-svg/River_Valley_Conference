const RVC_CONTACT_RECIPIENT = "contact@rvc-il.com";
const RVC_CONTACT_DIRECT_COPY = "amost@gracecrusaders.org";
const RVC_CONTACT_SENDER = "website@rvc-il.com";
const RVC_CONTACT_TYPE = "rvc-contact";

function doPost(e) {
  try {
    const payload = readJson_(e);
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("CONTACT_FORM_SECRET");

    if (!expectedSecret || !safeEqual_(String(payload.secret || ""), expectedSecret)) {
      return json_({ ok: false, error: "Unauthorized." });
    }

    if (payload.type !== RVC_CONTACT_TYPE) {
      return json_({ ok: false, error: "Unsupported form type." });
    }

    const aliases = GmailApp.getAliases();
    if (!aliases.includes(RVC_CONTACT_SENDER)) {
      console.error("Required Gmail send-as alias is missing.", { aliases });
      return json_({ ok: false, error: "The RVC sender alias is not configured." });
    }

    const name = clean_(payload.name, 120);
    const email = clean_(payload.email, 254).toLowerCase();
    const school = clean_(payload.school, 160);
    const subjectLabel = clean_(payload.subjectLabel, 120);
    const message = clean_(payload.message, 4000);

    if (!name || !isEmail_(email) || !subjectLabel || message.length < 10) {
      return json_({ ok: false, error: "Invalid contact submission." });
    }

    const subject = "[RVC Website] " + subjectLabel;
    const plainText = [
      "New message from the River Valley Conference website",
      "",
      "Name: " + name,
      "Email: " + email,
      "School/Organization: " + (school || "Not provided"),
      "Subject: " + subjectLabel,
      "",
      "Message:",
      message,
    ].join("\n");

    const htmlBody = [
      "<h2>New message from the River Valley Conference website</h2>",
      "<p><strong>Name:</strong> " + escapeHtml_(name) + "</p>",
      "<p><strong>Email:</strong> " + escapeHtml_(email) + "</p>",
      "<p><strong>School/Organization:</strong> " + escapeHtml_(school || "Not provided") + "</p>",
      "<p><strong>Subject:</strong> " + escapeHtml_(subjectLabel) + "</p>",
      "<hr>",
      "<p style=\"white-space:pre-wrap\">" + escapeHtml_(message) + "</p>",
    ].join("");

    GmailApp.sendEmail(RVC_CONTACT_DIRECT_COPY, subject, plainText, {
      from: RVC_CONTACT_SENDER,
      cc: RVC_CONTACT_RECIPIENT,
      htmlBody: htmlBody,
      replyTo: email,
      name: "River Valley Conference Website",
    });

    return json_({ ok: true, sender: RVC_CONTACT_SENDER });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: "Unable to send the message." });
  }
}

function readJson_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }
  const parsed = JSON.parse(e.postData.contents);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid request body.");
  }
  return parsed;
}

function clean_(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
