#!/usr/bin/env python3
"""Telegram relay for the Protoa agent team.

Runs inside GitHub Actions (the agents' cloud sessions can't keep a Telegram
connection of their own). The team lives in a Telegram group with topics: one
thread per agent (see config.json) plus the group's built-in General thread.

  outbound-comment  forward a new Team log comment (issue #2) to that agent's thread
  outbound-pr       announce a newly opened pull request in that agent's thread
  inbound           pull the owner's new messages and post them on the Team brief
                    (issue #1), where every agent reads its direction. A message
                    in an agent's thread is addressed to that agent.

The owner is the creator of the group, looked up from Telegram on every run, so
no user id has to be configured. Messages from anyone else are ignored.

Environment:
  TELEGRAM_BOT_TOKEN  bot token (repository secret)
  GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_PATH  provided by Actions
  RELAY_SINCE         unix time; inbound ignores messages sent before it
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG = json.load(open(os.path.join(HERE, "config.json")))
GROUP_ID = CONFIG["group_id"]
TOPICS = CONFIG["topics"]                      # agent name -> message_thread_id
AGENT_BY_TOPIC = {v: k for k, v in TOPICS.items()}
BRIEF_ISSUE = CONFIG["brief_issue"]
LOG_ISSUE = CONFIG["log_issue"]

INBOUND_MARKER = "📩 From Telegram (owner)"
TRUSTED = {"OWNER", "MEMBER", "COLLABORATOR"}
TG_LIMIT = 4000  # Telegram allows 4096 characters per message; keep a margin

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
REPO = os.environ.get("GITHUB_REPOSITORY", "")
GH_TOKEN = os.environ.get("GITHUB_TOKEN", "")


def die(msg):
    print(f"::error::{msg}")
    sys.exit(1)


# ---------------------------------------------------------------- Telegram

def tg(method, params=None, quiet=False):
    url = f"https://api.telegram.org/bot{TOKEN}/{method}"
    data = json.dumps(params).encode() if params is not None else None
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


def target(thread=None, chat=None):
    p = {"chat_id": chat if chat is not None else GROUP_ID}
    if thread:
        p["message_thread_id"] = thread
    return p


def send_text(text, thread=None, chat=None, reply_to=None):
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
    for i, c in enumerate(chunks):
        p = {**target(thread, chat), "text": c, "link_preview_options": {"is_disabled": True}}
        if reply_to and i == 0:
            p["reply_parameters"] = {"message_id": reply_to, "allow_sending_without_reply": True}
        r = tg("sendMessage", p)
        if not r.get("ok"):
            die("Could not send the message to Telegram.")


def send_photos(images, thread=None):
    """images: list of (caption, url). Falls back to links if Telegram can't fetch one."""
    failed = []
    for i in range(0, len(images), 10):
        batch = images[i:i + 10]
        if len(batch) == 1:
            cap, url = batch[0]
            r = tg("sendPhoto", {**target(thread), "photo": url, "caption": cap[:1000]}, quiet=True)
            if not r.get("ok"):
                failed += batch
        else:
            media = [{"type": "photo", "media": u, "caption": c[:1000]} for c, u in batch]
            r = tg("sendMediaGroup", {**target(thread), "media": media}, quiet=True)
            if not r.get("ok"):
                # One bad image fails the whole album; retry them one by one.
                for cap, url in batch:
                    r1 = tg("sendPhoto", {**target(thread), "photo": url, "caption": cap[:1000]}, quiet=True)
                    if not r1.get("ok"):
                        failed.append((cap, url))
    if failed:
        send_text("Some screenshots couldn't be shown here; open them directly:\n"
                  + "\n".join(f"• {c or 'image'}: {u}" for c, u in failed), thread)


def owner_id():
    r = tg("getChatAdministrators", {"chat_id": GROUP_ID})
    if not r.get("ok"):
        die("Could not read the team group's admins (is the bot still an admin there?).")
    for m in r["result"]:
        if m.get("status") == "creator":
            return m["user"]["id"]
    die("The team group has no visible creator; can't tell who the owner is.")


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
TAG_RE = re.compile(r"\[(quality|content|ux)\]", re.I)


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


def thread_for(text):
    """The agent thread for a post or PR title tagged [quality]/[content]/[ux]; None = General."""
    m = TAG_RE.search(text[:200])
    return TOPICS.get(m.group(1).lower()) if m else None


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
    body = c.get("body") or ""
    thread = thread_for(body)
    text, images = markdown_to_plain(body)
    send_text(f"{text}\n\n🔗 {c['html_url']}", thread)
    if images:
        send_photos(images, thread)
    print(f"Forwarded log comment {c['id']} with {len(images)} image(s) to thread {thread or 'General'}.")


def outbound_pr():
    ev = json.load(open(os.environ["GITHUB_EVENT_PATH"]))
    pr = ev["pull_request"]
    if pr.get("author_association") not in TRUSTED:
        print(f"Ignoring PR from {pr['user']['login']} ({pr.get('author_association')}).")
        return
    thread = thread_for(pr["title"])
    body, _ = markdown_to_plain(pr.get("body") or "")
    if len(body) > 900:
        body = body[:900].rsplit("\n", 1)[0] + "\n…"
    send_text(f"🔀 New pull request #{pr['number']}: {pr['title']}\n\n{body}\n\n🔗 {pr['html_url']}", thread)
    print(f"Announced PR #{pr['number']} in thread {thread or 'General'}.")


HELP = (
    "Write to the team here and I'll pass it on. Each agent reads your messages at "
    "the start of its next run (every agent runs every 4 hours).\n\n"
    "• A message in an agent's thread (Quality, Content, UX) goes to that agent only.\n"
    "• A message in General goes to the whole team, unless it starts with an agent's "
    "name (\"content: …\").\n"
    "• To set a new mission: \"new mission: …\" in that agent's thread.\n"
    "• Newer messages override older ones.\n"
    "• /prs lists the open pull requests.  /help shows this message."
)


def list_prs():
    prs = gh("pulls?state=open&per_page=50")
    if not prs:
        return "No open pull requests right now."
    return "Open pull requests:\n\n" + "\n\n".join(
        f"#{p['number']} {p['title']}\n{p['html_url']}" for p in prs)


def inbound():
    since = int(os.environ.get("RELAY_SINCE", "0") or 0)
    r = tg("getUpdates", {"timeout": 0, "allowed_updates": ["message"]})
    if not r.get("ok"):
        die("Could not read Telegram updates (check the TELEGRAM_BOT_TOKEN secret).")
    updates = r.get("result", [])
    if not updates:
        print("No new Telegram messages.")
        return
    owner = owner_id()
    last_id = None
    relayed = 0
    for u in updates:
        last_id = u["update_id"]
        msg = u.get("message") or {}
        chat = msg.get("chat") or {}
        sender = (msg.get("from") or {}).get("id")
        in_group = chat.get("id") == GROUP_ID
        in_dm = chat.get("type") == "private"
        if sender != owner or not (in_group or in_dm):
            print(f"Skipping update {u['update_id']}: not the owner, or not the team group / a DM.")
            continue
        if msg.get("date", 0) < since:
            print(f"Skipping update {u['update_id']}: sent before the relay was set up.")
            continue
        thread = msg.get("message_thread_id") if in_group and msg.get("is_topic_message") else None
        agent = AGENT_BY_TOPIC.get(thread)
        reply = dict(thread=thread, chat=None if in_group else chat["id"], reply_to=msg.get("message_id"))
        text = (msg.get("text") or msg.get("caption") or "").strip()
        if not text:
            # Service messages (topic created, member joined, ...) have no text and need no answer.
            if any(k in msg for k in ("photo", "document", "voice", "video", "sticker", "audio")):
                send_text("I can only pass text to the agents for now. Please type it out.", **reply)
            continue
        cmd = text.split()[0].split("@")[0].lower() if text.startswith("/") else ""
        if cmd in ("/start", "/help"):
            send_text(HELP, **reply)
        elif cmd == "/prs":
            send_text(list_prs(), **reply)
        else:
            if agent and not re.match(rf"\s*{agent}\s*:", text, re.I):
                text = f"{agent}: {text}"
            when = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(msg.get("date", time.time())))
            gh(f"issues/{BRIEF_ISSUE}/comments", "POST", {"body": f"{INBOUND_MARKER}, {when}:\n\n{text}"})
            relayed += 1
            who = f"the {agent} agent" if agent else "the team"
            send_text(f"✅ Passed to {who}. It'll be picked up at the start of the next run.", **reply)
    # Confirm everything up to last_id so Telegram doesn't send it again.
    tg("getUpdates", {"offset": last_id + 1, "timeout": 0, "allowed_updates": ["message"]})
    print(f"Processed {len(updates)} update(s), relayed {relayed} message(s) to the brief.")


def main():
    if not TOKEN:
        # Not configured yet: skip quietly instead of failing every few minutes.
        print("::notice::Telegram relay is not set up yet: add the TELEGRAM_BOT_TOKEN repository secret.")
        return
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    {"outbound-comment": outbound_comment, "outbound-pr": outbound_pr, "inbound": inbound}.get(
        mode, lambda: die(f"Unknown mode {mode!r}"))()


if __name__ == "__main__":
    main()
