"""Gmail connector — fetches decision-relevant email threads."""
from __future__ import annotations
import base64
from typing import Any


async def fetch_gmail_threads(gmail_service: Any, max_results: int = 20) -> list[dict]:
    """
    Uses google-api-python-client Gmail service object.
    Returns a list of doc dicts ready for IngestionAgent.ingest_batch().
    """
    import asyncio

    loop = asyncio.get_event_loop()

    def _fetch():
        threads_resp = gmail_service.users().threads().list(
            userId="me", maxResults=max_results, q="label:inbox"
        ).execute()
        threads = threads_resp.get("threads", [])
        docs = []
        for t in threads:
            thread = gmail_service.users().threads().get(
                userId="me", id=t["id"], format="full"
            ).execute()
            messages = thread.get("messages", [])
            texts = []
            subject = ""
            sender = ""
            for msg in messages:
                headers = {h["name"]: h["value"] for h in msg["payload"].get("headers", [])}
                if not subject:
                    subject = headers.get("Subject", "No Subject")
                if not sender:
                    sender = headers.get("From", "")
                body = _extract_body(msg["payload"])
                if body:
                    texts.append(body)
            if texts:
                docs.append({
                    "content": "\n\n".join(texts),
                    "source_type": "gmail",
                    "title": subject,
                    "author": sender,
                    "thread_id": t["id"],
                    "metadata": {"message_count": len(messages)},
                })
        return docs

    return await loop.run_in_executor(None, _fetch)


def _extract_body(payload: dict) -> str:
    body = payload.get("body", {})
    data = body.get("data", "")
    if data:
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")
    for part in payload.get("parts", []):
        text = _extract_body(part)
        if text:
            return text
    return ""
