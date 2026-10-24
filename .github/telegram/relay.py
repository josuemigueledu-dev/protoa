#!/usr/bin/env python3
"""Telegram relay for the Protoa agent team.

Runs inside GitHub Actions (the agents' cloud sessions can't keep a Telegram
connection of their own). Three modes:

  outbound-comment  forward a new Team log comment (issue #2) to the owner's chat
  outbound-pr       announce a newly opened pull request
  inbound           pull the owner's new Telegram messages and post them on the
                    Team brief (issue #1), where every agent reads its direction

Environment:
  TELEGRAM_BOT_TOKEN  bot token (repository secret)
  TELEGRAM_OWNER_ID   the owner's numeric Telegram user id (repository variable);
                      it is also the chat id for private messages
  GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_PATH  provided by Actions
  RELAY_SINCE         unix time; inbound ignores messages sent before it
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BRIEF_ISSUE = 1
LOG_ISSUE = 2
INBOUND_MARKER = "📩 From Telegram (owner)"
TRUSTED = {"OWNER", "MEMBER", "COLLABORATOR"}
TG_LIMIT = 4000  # Telegram allows 4096 characters per message; keep a margin

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
OWNER_ID = os.environ.get("TELEGRAM_OWNER_ID", "").strip()
REPO = os.environ.get("GITHUB_REPOSITORY", "")
GH_TOKEN = os.environ.get("GITHUB_TOKEN", "")


def die(msg):
    print(f"::error::{msg}")
    sys.exit(1)


# ---------------------------------------------------------------- Telegram

def tg(method, params=None, quiet=False):
    url = f"https://api.telegram.org/bot{TOKEN}/{method}"
    data = None
    if params is not None:
        data = json.dumps(params).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        # Never print the URL: it contains the token.
        if not quiet:
            print(f"::warning::Telegram {method} failed: {e.code} {body[:300]}")
        return {"ok": False, "error_code": e.code, "description": body}


def send_text(text):
    text = text.strip() or "(empty)"
    chunks = []
    while text:
        if len(text) <= TG_LIMIT:
            chunks.append(text)
            break
        cut = text.rfind("\n", 0, TG_LIMIT)
        if cut < TG_LIMIT // 2:
            cut = TG_LIMIT
        chunks.append(text[:cut])
        text = text[cut:].lstrip("\n")
    for c in chunks:
        r = tg("sendMessage", {"chat_id": OWNER_ID, "text": c, "disable_web_page_preview": True})
        if not r.get("ok"):
            die("Could not send the message to Telegram (check the TELEGRAM_BOT_TOKEN secret).")


def send_photos(images):
    """images: list of (caption, url). Falls back to links if Telegram can't fetch one."""
    failed = []
    for i in range(0, len(images), 10):
        batch = images[i:i + 10]
        if len(batch) == 1:
            cap, url = batch[0]
            r = tg("sendPhoto", {"chat_id": OWNER_ID, "photo": url, "caption": cap[:1000]}, quiet=True)
            if not r.get("ok"):
                failed += batch
        else:
            media = [{"type": "photo", "media": u, "caption": c[:1000]} for c, u in batch]
            r = tg("sendMediaGroup", {"chat_id": OWNER_ID, "media": media}, quiet=True)
            if not r.get("ok"):
                # One bad image fails the whole album; retry them one by one.
                for cap, url in batch:
                    r1 = tg("sendPhoto", {"chat_id": OWNER_ID, "photo": url, "caption": cap[:1000]}, quiet=True)
                    if not r1.get("ok"):
                        failed.append((cap, url))
    if failed:
        send_text("Some screenshots couldn't be shown here; open them directly:\n"
                  + "\n".join(f"• {c or 'image'}: {u}" for c, u in failed))


# ---------------------------------------------------------------- GitHub

def gh(path, method="GET", payload=None):
    url = f"https://api.github.com/repos/{REPO}/{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {GH_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


# ---------------------------------------------------------------- formatting

IMG_RE = re.compile(r"!\[([^\]]*)\]\((https?://[^)\s]+)\)")
LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+)\)")


def markdown_to_plain(md):
    """Turn an agent's markdown post into readable plain text plus a list of images."""
    images = IMG_RE.findall(md)
    text = IMG_RE.sub("", md)
    text = LINK_RE.sub(lambda m: f"{m.group(1)} ({m.group(2)})", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.M)        # headings
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)                # bold
    text = re.sub(r"(?<!\w)__(.+?)__(?!\w)", r"\1", text)
    text = re.sub(r"`([^`\n]+)`", r"\1", text)                  # inline code
    text = re.sub(r"^\s*[-*]\s+", "• ", text, flags=re.M)       # bullets
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)          # html comments
    text = re.sub(r"[ \t]+$", "", text, flags=re.M)             # trailing spaces
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip(), images


# ---------------------------------------------------------------- modes

def outbound_comment():
    ev = json.load(open(os.environ["GITHUB_EVENT_PATH"]))
    if ev.get("issue", {}).get("number") != LOG_ISSUE:
        print("Not the Team log; nothing to do.")
        return
    c = ev["comment"]
    if c.get("author_association") not in TRUSTED:
        print(f"Ignoring comment from {c['user']['login']} ({c.get('author_association')}).")
        return
    text, images = markdown_to_plain(c.get("body") or "")
    send_text(f"{text}\n\n🔗 {c['html_url']}")
    if images:
        send_photos(images)
    print(f"Forwarded log comment {c['id']} with {len(images)} image(s).")


def outbound_pr():
    ev = json.load(open(os.environ["GITHUB_EVENT_PATH"]))
    pr = ev["pull_request"]
    if pr.get("author_association") not in TRUSTED:
        print(f"Ignoring PR from {pr['user']['login']} ({pr.get('author_association')}).")
        return
    body, _ = markdown_to_plain(pr.get("body") or "")
    if len(body) > 900:
        body = body[:900].rsplit("\n", 1)[0] + "\n…"
    send_text(f"🔀 New pull request #{pr['number']}: {pr['title']}\n\n{body}\n\n🔗 {pr['html_url']}")
    print(f"Announced PR #{pr['number']}.")


HELP = (
    "Message me anything and I'll pass it to the agents; each one reads your "
    "messages at the start of its next run (every agent runs every 4 hours).\n\n"
    "• To address one agent, start with its name: \"content: …\", \"ux: …\" or \"quality: …\". "
    "Anything else goes to the whole team.\n"
    "• Newer messages override older ones.\n"
    "• /prs lists the open pull requests.\n"
    "• /help shows this message."
)


def list_prs():
    prs = gh("pulls?state=open&per_page=50")
    if not prs:
        return "No open pull requests right now."
    lines = [f"#{p['number']} {p['title']}\n{p['html_url']}" for p in prs]
    return "Open pull requests:\n\n" + "\n\n".join(lines)


def inbound():
    since = int(os.environ.get("RELAY_SINCE", "0") or 0)
    r = tg("getUpdates", {"timeout": 0, "allowed_updates": ["message"]})
    if not r.get("ok"):
        die("Could not read Telegram updates (check the TELEGRAM_BOT_TOKEN secret).")
    updates = r.get("result", [])
    if not updates:
        print("No new Telegram messages.")
        return
    last_id = None
    relayed = 0
    for u in updates:
        msg = u.get("message") or {}
        sender = str((msg.get("from") or {}).get("id", ""))
        chat_type = (msg.get("chat") or {}).get("type")
        if sender != OWNER_ID or chat_type != "private":
            print(f"Skipping update {u['update_id']} from an unknown sender.")
            last_id = u["update_id"]
            continue
        if msg.get("date", 0) < since:
            print(f"Skipping update {u['update_id']}: sent before the relay was set up.")
            last_id = u["update_id"]
            continue
        text = (msg.get("text") or msg.get("caption") or "").strip()
        if not text:
            send_text("I can only pass text messages to the agents for now. Please type it out.")
        elif text.lower().startswith("/start") or text.lower().startswith("/help"):
            send_text(HELP)
        elif text.lower().startswith("/prs"):
            send_text(list_prs())
        else:
            when = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(msg.get("date", time.time())))
            body = f"{INBOUND_MARKER}, {when}:\n\n{text}"
            gh(f"issues/{BRIEF_ISSUE}/comments", "POST", {"body": body})
            relayed += 1
            send_text("✅ Passed to the agents. Each one will see it at the start of its next run.")
        last_id = u["update_id"]
    if last_id is not None:
        # Confirm everything up to last_id so Telegram doesn't send it again.
        tg("getUpdates", {"offset": last_id + 1, "timeout": 0, "allowed_updates": ["message"]})
    print(f"Processed {len(updates)} update(s), relayed {relayed} message(s) to the brief.")


def main():
    if not TOKEN:
        die("TELEGRAM_BOT_TOKEN secret is not set.")
    if not OWNER_ID:
        die("TELEGRAM_OWNER_ID variable is not set.")
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    {"outbound-comment": outbound_comment, "outbound-pr": outbound_pr, "inbound": inbound}.get(
        mode, lambda: die(f"Unknown mode {mode!r}"))()


if __name__ == "__main__":
    main()
