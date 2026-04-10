"""Slack connector — fetches messages from channels."""
from __future__ import annotations
from config import get_settings
cfg = get_settings()


async def fetch_slack_messages(channel_ids: list[str], days: int = 7) -> list[dict]:
    from slack_sdk.web.async_client import AsyncWebClient
    from datetime import datetime, timedelta
    import time

    client = AsyncWebClient(token=cfg.slack_bot_token)
    oldest = str((datetime.utcnow() - timedelta(days=days)).timestamp())
    docs = []

    for channel_id in channel_ids:
        resp = await client.conversations_history(channel=channel_id, oldest=oldest, limit=200)
        messages = resp.get("messages", [])
        if not messages:
            continue
        thread_text = "\n".join(
            f"[{m.get('user','?')}] {m.get('text','')}"
            for m in messages if m.get("text")
        )
        docs.append({
            "content": thread_text,
            "source_type": "slack",
            "title": f"Slack #{channel_id} — last {days}d",
            "metadata": {"channel_id": channel_id, "message_count": len(messages)},
        })
    return docs
