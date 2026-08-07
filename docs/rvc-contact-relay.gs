const RVC_CONTACT_RECIPIENT = "contact@rvc-il.com";
const RVC_CONTACT_DIRECT_COPY = "amost@gracecrusaders.org";
const RVC_CONTACT_SENDER = "website@rvc-il.com";
const RVC_CONTACT_TYPE = "rvc-contact";

// Matches the live RVC website palette.
const RVC_NAVY = "#0940AE";
const RVC_GOLD = "#F59F0A";
const RVC_GREEN = "#36D399";
const RVC_BACKGROUND = "#F4F6F8";
const RVC_TEXT = "#172033";
const RVC_MUTED = "#667085";
const RVC_BORDER = "#E3E8EF";

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

    ensureSenderAlias_();

    const name = clean_(payload.name, 120);
    const email = clean_(payload.email, 254).toLowerCase();
    const school = clean_(payload.school, 160);
    const subjectLabel = clean_(payload.subjectLabel, 120);
    const message = clean_(payload.message, 4000);

    if (!name || !isEmail_(email) || !subjectLabel || message.length < 10) {
      return json_({ ok: false, error: "Invalid contact submission." });
    }

    const subject = "[RVC Website] " + subjectLabel + " — " + name;
    const submittedAt = Utilities.formatDate(new Date(), "America/Chicago", "MMM d, yyyy 'at' h:mm a z");

    const plainText = buildPlainText_(name, email, school, subjectLabel, message, submittedAt);
    const htmlBody = buildEmailHtml_(name, email, school, subjectLabel, message, submittedAt);

    GmailApp.sendEmail(RVC_CONTACT_DIRECT_COPY, subject, plainText, {
      from: RVC_CONTACT_SENDER,
      cc: RVC_CONTACT_RECIPIENT,
      htmlBody: htmlBody,
      replyTo: email,
      name: "River Valley Conference Website",
    });

    return json_({ ok: true, sender: RVC_CONTACT_SENDER });
  } catch (error) {
    console.error("RVC contact relay failed", error);
    return json_({ ok: false, error: "Unable to send the message." });
  }
}

function buildPlainText_(name, email, school, subjectLabel, message, submittedAt) {
  return [
    "RIVER VALLEY CONFERENCE",
    "New Website Inquiry",
    "",
    "Name: " + name,
    "Email: " + email,
    "School/Organization: " + (school || "Not provided"),
    "Inquiry Type: " + subjectLabel,
    "Submitted: " + submittedAt,
    "",
    "MESSAGE",
    message,
    "",
    "Reply to this email to respond directly to " + name + " at " + email + ".",
    "",
    "River Valley Conference • rvc-il.com",
  ].join("\n");
}

function buildEmailHtml_(name, email, school, subjectLabel, message, submittedAt) {
  const safeName = escapeHtml_(name);
  const safeEmail = escapeHtml_(email);
  const safeSchool = escapeHtml_(school || "Not provided");
  const safeSubject = escapeHtml_(subjectLabel);
  const safeMessage = escapeHtml_(message).replace(/\n/g, "<br>");
  const safeSubmittedAt = escapeHtml_(submittedAt);
  const replyHref = "mailto:" + email + "?subject=" + encodeURIComponent("Re: RVC Website Inquiry — " + subjectLabel);

  return [
    '<!doctype html>',
    '<html><body style="margin:0;padding:0;background:', RVC_BACKGROUND, ';font-family:Arial,Helvetica,sans-serif;color:', RVC_TEXT, ';">',

    // Hidden preheader for inbox previews.
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">',
    'New RVC website inquiry from ', safeName, ' — ', safeSubject,
    '</div>',

    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:', RVC_BACKGROUND, ';padding:28px 12px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid ', RVC_BORDER, ';border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(9,64,174,0.08);">',

    // Header.
    '<tr><td style="background:', RVC_NAVY, ';padding:0;">',
    '<div style="height:5px;background:', RVC_GOLD, ';line-height:5px;font-size:5px;">&nbsp;</div>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>',
    '<td style="padding:26px 30px;">',
    '<div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.5px;color:#DCE7FF;text-transform:uppercase;">River Valley Conference</div>',
    '<div style="font-size:27px;line-height:34px;font-weight:700;color:#ffffff;margin-top:4px;">New Website Inquiry</div>',
    '</td>',
    '<td width="72" align="center" style="padding:20px 24px 20px 0;">',
    '<div style="width:54px;height:54px;border-radius:14px;background:#ffffff;color:', RVC_NAVY, ';font-size:20px;line-height:54px;font-weight:800;text-align:center;">RVC</div>',
    '</td>',
    '</tr></table>',
    '</td></tr>',

    // Intro / category pill.
    '<tr><td style="padding:26px 30px 10px 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>',
    '<td style="font-size:15px;line-height:23px;color:', RVC_MUTED, ';">A new message was submitted through <strong style="color:', RVC_TEXT, ';">rvc-il.com</strong>.</td>',
    '<td align="right" style="padding-left:12px;">',
    '<span style="display:inline-block;background:#ECFDF7;color:#087A58;border:1px solid #B8F0DD;border-radius:999px;padding:6px 11px;font-size:12px;line-height:16px;font-weight:700;white-space:nowrap;">', safeSubject, '</span>',
    '</td>',
    '</tr></table>',
    '</td></tr>',

    // Sender card.
    '<tr><td style="padding:12px 30px 0 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid ', RVC_BORDER, ';border-radius:12px;">',
    '<tr><td style="padding:20px 22px;">',
    '<div style="font-size:21px;line-height:28px;font-weight:700;color:', RVC_TEXT, ';">', safeName, '</div>',
    '<div style="margin-top:10px;font-size:14px;line-height:22px;">',
    '<span style="color:', RVC_MUTED, ';">Email&nbsp;&nbsp;</span><a href="mailto:', safeEmail, '" style="color:', RVC_NAVY, ';font-weight:600;text-decoration:none;">', safeEmail, '</a><br>',
    '<span style="color:', RVC_MUTED, ';">School / Organization&nbsp;&nbsp;</span><span style="color:', RVC_TEXT, ';font-weight:600;">', safeSchool, '</span><br>',
    '<span style="color:', RVC_MUTED, ';">Submitted&nbsp;&nbsp;</span><span style="color:', RVC_TEXT, ';">', safeSubmittedAt, '</span>',
    '</div>',
    '</td></tr></table>',
    '</td></tr>',

    // Message.
    '<tr><td style="padding:24px 30px 0 30px;">',
    '<div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.1px;color:', RVC_MUTED, ';text-transform:uppercase;margin-bottom:9px;">Message</div>',
    '<div style="font-size:16px;line-height:26px;color:', RVC_TEXT, ';background:#ffffff;border-left:4px solid ', RVC_GOLD, ';padding:4px 0 4px 18px;">', safeMessage, '</div>',
    '</td></tr>',

    // Reply button.
    '<tr><td style="padding:28px 30px 8px 30px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="', RVC_NAVY, '" style="border-radius:9px;">',
    '<a href="', replyHref, '" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:700;border-radius:9px;">Reply to ', safeName, '</a>',
    '</td></tr></table>',
    '<div style="font-size:12px;line-height:19px;color:', RVC_MUTED, ';margin-top:10px;">You can also simply click <strong>Reply</strong> in Gmail; replies are addressed directly to ', safeName, '.</div>',
    '</td></tr>',

    // Footer.
    '<tr><td style="padding:22px 30px 26px 30px;">',
    '<div style="border-top:1px solid ', RVC_BORDER, ';padding-top:18px;font-size:12px;line-height:19px;color:#8992A3;">',
    'River Valley Conference &nbsp;•&nbsp; <a href="https://rvc-il.com" style="color:', RVC_NAVY, ';text-decoration:none;">rvc-il.com</a><br>',
    'This notification was generated automatically from the RVC website contact form.',
    '</div>',
    '</td></tr>',

    '</table>',
    '</td></tr></table>',
    '</body></html>',
  ].join("");
}

/** Manual delivery + design test from the Apps Script editor. */
function testRvcContactEmail() {
  ensureSenderAlias_();

  const name = "Sample Visitor";
  const email = RVC_CONTACT_DIRECT_COPY;
  const school = "Example Christian School";
  const subjectLabel = "General Question";
  const message = "This is a preview of the polished River Valley Conference website inquiry notification. The real message from a visitor will appear here, with line breaks and longer text displayed cleanly.";
  const submittedAt = Utilities.formatDate(new Date(), "America/Chicago", "MMM d, yyyy 'at' h:mm a z");
  const subject = "[RVC Website] Email Design Test — " + name;

  GmailApp.sendEmail(
    RVC_CONTACT_DIRECT_COPY,
    subject,
    buildPlainText_(name, email, school, subjectLabel, message, submittedAt),
    {
      from: RVC_CONTACT_SENDER,
      cc: RVC_CONTACT_RECIPIENT,
      replyTo: email,
      htmlBody: buildEmailHtml_(name, email, school, subjectLabel, message, submittedAt),
      name: "River Valley Conference Website",
    }
  );
}

function showAvailableAliases() {
  const aliases = GmailApp.getAliases();
  console.log("Available aliases:", aliases);
  return aliases;
}

function ensureSenderAlias_() {
  const aliases = GmailApp.getAliases().map(function(alias) { return alias.toLowerCase(); });
  if (!aliases.includes(RVC_CONTACT_SENDER.toLowerCase())) {
    throw new Error(RVC_CONTACT_SENDER + " is not available as a verified Gmail sending alias.");
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
