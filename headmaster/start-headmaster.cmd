@echo off
rem Starts the Protoa headmaster: Claude Code connected to the "Protoa Headmaster" Telegram bot.
rem Keep this window open; closing it takes the headmaster offline.
rem --add-dir .. lets it work in the whole repo (the folder above) without asking each time.
cd /d "%~dp0"
git -C .. pull --ff-only
claude --add-dir .. --channels plugin:telegram@claude-plugins-official
