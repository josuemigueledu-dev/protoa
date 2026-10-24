@echo off
rem Starts the Protoa headmaster: Claude Code connected to the "Protoa Headmaster" Telegram bot.
rem Keep this window open; closing it takes the headmaster offline.
cd /d "%~dp0"
git -C .. pull --ff-only
claude --channels plugin:telegram@claude-plugins-official
