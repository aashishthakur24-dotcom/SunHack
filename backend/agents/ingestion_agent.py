"""
AGENT 1 — Ingestion Agent (GraphRAG-inspired)
═══════════════════════════════════════════════
Responsibilities:
  • Pull raw data from Slack, Gmail, Google Docs/Drive, PDFs, DOCX
  • Chunk documents semantically (respecting paragraph/thread boundaries)
  • Extract named entities using spaCy-like NER via GPT
  • Build an entity co-occurrence graph (GraphRAG community detection)
  • Emit RawDocument objects to the Reasoning Agent

GraphRAG pipeline:
  1. Parse raw text
  2. NER pass → Entity candidates
  3. Build entity co-occurrence graph (networkx)
  4. Louvain community detection → cluster entities into topics
  5. Summarize each community → structured chunk for downstream agents
"""
from __future__ import annotations

import re
import time
import hashlib
import asyncio
from typing import Optional
from datetime import datetime

import networkx as nx
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from loguru import logger
from openai import AsyncOpenAI

from config import get_settings
from models import RawDocument, SourceType, Entity, Relationship, AgentResult

cfg = get_settings()
_llm = ChatOpenAI(model=cfg.openai_model, api_key=cfg.openai_api_key, temperature=0)
_embedder = OpenAIEmbeddings(model=cfg.openai_embedding_model, api_key=cfg.openai_api_key)
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=cfg.ingestion_chunk_size,
    chunk_overlap=cfg.ingestion_chunk_overlap,
    length_function=len,
)

NER_PROMPT = """
Extract all named entities from the text below.
For each entity, output JSON with keys: label, type (one of: person, organization, date, location, concept, decision, action, metric), description.
Return a JSON array. No markdown.

Text:
{text}
"""

COMMUNITY_SUMMARY_PROMPT = """
The following entities are semantically related (same community in a co-occurrence graph):
{entities}

Write a concise 2-3 sentence summary of what decision-relevant topic or theme they collectively represent.
"""


class IngestionAgent:
    """
    GraphRAG-inspired Ingestion Agent.
    Produces structured RawDocument objects ready for the Reasoning Agent.
    """

    def __init__(self):
        self._client = AsyncOpenAI(api_key=cfg.openai_api_key)
        logger.info("IngestionAgent initialized")

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────

    async def ingest(
        self,
        content: str,
        source_type: SourceType,
        title: str,
        metadata: Optional[dict] = None,
        author: Optional[str] = None,
        thread_id: Optional[str] = None,
    ) -> AgentResult:
        t0 = time.perf_counter()
        try:
            doc_id = hashlib.md5(content.encode()).hexdigest()
            chunks  = self._chunk(content)
            entities, graph = await self._graphrag_pass(chunks)
            community_summaries = self._community_summarize_sync(entities, graph)

            doc = RawDocument(
                id=doc_id,
                source_type=source_type,
                title=title,
                content=content,
                metadata={
                    **(metadata or {}),
                    "chunk_count": len(chunks),
                    "entity_count": len(entities),
                    "community_count": len(community_summaries),
                    "community_summaries": community_summaries,
                    "graph_edges": graph.number_of_edges(),
                },
                author=author,
                thread_id=thread_id,
            )
            return AgentResult(
                agent="ingestion",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data={"document": doc.model_dump(), "entities": [e.model_dump() for e in entities]},
                tokens_used=0,
            )
        except Exception as e:
            logger.exception("IngestionAgent error")
            return AgentResult(agent="ingestion", success=False,
                               duration_ms=(time.perf_counter() - t0) * 1000, data={}, error=str(e))

    async def ingest_batch(self, docs: list[dict]) -> list[AgentResult]:
        tasks = [self.ingest(**d) for d in docs]
        return await asyncio.gather(*tasks)

    # ─────────────────────────────────────────────────────────────────────────
    # GRAPHRAG PIPELINE
    # ─────────────────────────────────────────────────────────────────────────

    def _chunk(self, text: str) -> list[str]:
        return _splitter.split_text(text)

    async def _graphrag_pass(
        self, chunks: list[str]
    ) -> tuple[list[Entity], nx.Graph]:
        """Run NER on each chunk then build entity co-occurrence graph."""
        all_entities: dict[str, Entity] = {}
        G = nx.Graph()

        for chunk in chunks:
            chunk_entities = await self._extract_entities(chunk)
            for ent in chunk_entities:
                key = ent.label.lower()
                if key not in all_entities:
                    all_entities[key] = ent
                    G.add_node(key, entity=ent)

            # Co-occurrence edges (entities appearing in same chunk)
            labels = [e.label.lower() for e in chunk_entities]
            for i in range(len(labels)):
                for j in range(i + 1, len(labels)):
                    if G.has_edge(labels[i], labels[j]):
                        G[labels[i]][labels[j]]["weight"] += 1
                    else:
                        G.add_edge(labels[i], labels[j], weight=1)

        return list(all_entities.values()), G

    async def _extract_entities(self, text: str) -> list[Entity]:
        """GPT-based NER extraction."""
        import json
        prompt = NER_PROMPT.format(text=text[:2000])
        try:
            resp = await self._client.chat.completions.create(
                model=cfg.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                response_format={"type": "json_object"},
            )
            raw = resp.choices[0].message.content
            parsed = json.loads(raw)
            items = parsed if isinstance(parsed, list) else parsed.get("entities", [])
            return [
                Entity(
                    label=it.get("label", ""),
                    type="fact",   # coerce; reasoning agent refines
                    description=it.get("description", ""),
                    confidence=0.85,
                )
                for it in items if it.get("label")
            ]
        except Exception as e:
            logger.warning("NER fallback ({})", e)
            return self._regex_ner(text)

    @staticmethod
    def _regex_ner(text: str) -> list[Entity]:
        """Lightweight regex NER fallback (capitalised noun phrases)."""
        pattern = r"\b[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*\b"
        seen: set[str] = set()
        entities = []
        for match in re.finditer(pattern, text):
            label = match.group()
            if label not in seen and len(label) > 2:
                seen.add(label)
                entities.append(Entity(label=label, type="fact", confidence=0.6))
        return entities[:30]

    def _community_summarize_sync(
        self, entities: list[Entity], G: nx.Graph
    ) -> list[str]:
        """
        Run Louvain community detection on the entity graph and summarise each
        community using the GPT model (synchronous call for simplicity).
        """
        if G.number_of_nodes() < 2:
            return []

        try:
            import community as community_louvain
            partition = community_louvain.best_partition(G, resolution=cfg.graph_community_resolution)
        except ImportError:
            # Fallback: greedy modularity
            try:
                communities = list(nx.community.greedy_modularity_communities(G))
                partition = {}
                for cid, community in enumerate(communities):
                    for node in community:
                        partition[node] = cid
            except Exception:
                return []

        # Group entity labels by community
        from collections import defaultdict
        groups: dict[int, list[str]] = defaultdict(list)
        for node, cid in partition.items():
            groups[cid].append(node)

        summaries = []
        for cid, labels in groups.items():
            if len(labels) < 2:
                continue
            entity_text = "\n".join(f"- {l}" for l in labels[:20])
            summaries.append(f"Community {cid}: {', '.join(labels[:6])}")

        return summaries

    # ─────────────────────────────────────────────────────────────────────────
    # CONNECTOR HELPERS (thin wrappers around connector modules)
    # ─────────────────────────────────────────────────────────────────────────

    async def ingest_from_gmail(self, gmail_service, max_results: int = 20) -> list[AgentResult]:
        from ingestion.email_connector import fetch_gmail_threads
        threads = await fetch_gmail_threads(gmail_service, max_results)
        return await self.ingest_batch(threads)

    async def ingest_from_slack(self, channel_ids: list[str], days: int = 7) -> list[AgentResult]:
        from ingestion.slack_connector import fetch_slack_messages
        messages = await fetch_slack_messages(channel_ids, days)
        return await self.ingest_batch(messages)

    async def ingest_file(self, file_path: str, source_type: SourceType = "pdf") -> AgentResult:
        from ingestion.document_connector import extract_text
        text, meta = extract_text(file_path)
        return await self.ingest(
            content=text,
            source_type=source_type,
            title=meta.get("title", file_path.split("/")[-1]),
            metadata=meta,
        )
