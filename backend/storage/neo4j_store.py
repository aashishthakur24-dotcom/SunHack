"""
Neo4j Graph Storage Layer
Stores entities, relationships, and decision graphs for the Memory Agent,
Query Agent (graph traversal), and Conflict Detection Agent.
"""
from __future__ import annotations
from contextlib import contextmanager
from typing import Optional, Any
from loguru import logger
from neo4j import GraphDatabase, Session
from neo4j.exceptions import ServiceUnavailable
from config import get_settings
from models import Entity, Relationship, DecisionIntelligence, Conflict

cfg = get_settings()


class Neo4jStore:
    """Graph database layer backed by Neo4j."""

    def __init__(self):
        try:
            self._driver = GraphDatabase.driver(
                cfg.neo4j_uri,
                auth=(cfg.neo4j_username, cfg.neo4j_password),
                max_connection_pool_size=20,
            )
            self._driver.verify_connectivity()
            self._ensure_indexes()
            logger.info("Neo4j connected at {}", cfg.neo4j_uri)
        except ServiceUnavailable:
            logger.warning("Neo4j not reachable — graph features will be mocked")
            self._driver = None

    @contextmanager
    def _session(self):
        if not self._driver:
            raise RuntimeError("Neo4j not available")
        with self._driver.session() as session:
            yield session

    def close(self):
        if self._driver:
            self._driver.close()

    # ── Schema ────────────────────────────────────────────────────────────────

    def _ensure_indexes(self):
        with self._session() as s:
            s.run("CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE")
            s.run("CREATE CONSTRAINT decision_id IF NOT EXISTS FOR (d:Decision) REQUIRE d.id IS UNIQUE")
            s.run("CREATE CONSTRAINT source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.id IS UNIQUE")
            s.run("CREATE INDEX entity_label IF NOT EXISTS FOR (e:Entity) ON (e.label)")
        logger.debug("Neo4j indexes ensured")

    # ── Write Decision Graph ──────────────────────────────────────────────────

    def save_decision(self, decision: DecisionIntelligence) -> None:
        if not self._driver:
            return
        with self._session() as s:
            # Upsert decision node
            s.run("""
                MERGE (d:Decision {id: $id})
                SET d.title = $title,
                    d.summary = $summary,
                    d.confidence = $confidence,
                    d.created_at = $created_at
            """, id=decision.id, title=decision.title, summary=decision.summary,
                 confidence=decision.confidence, created_at=str(decision.created_at))

            # Upsert entities + link to decision
            for ent in decision.entities:
                s.run("""
                    MERGE (e:Entity {id: $id})
                    SET e.label = $label, e.type = $type,
                        e.description = $desc, e.confidence = $conf
                    WITH e
                    MATCH (d:Decision {id: $did})
                    MERGE (d)-[:CONTAINS]->(e)
                """, id=ent.id, label=ent.label, type=ent.type,
                     desc=ent.description, conf=ent.confidence, did=decision.id)

            # Upsert relationships between entities
            for rel in decision.relationships:
                s.run(f"""
                    MATCH (a:Entity {{id: $src}}), (b:Entity {{id: $tgt}})
                    MERGE (a)-[r:{rel.relation}]->(b)
                    SET r.weight = $weight, r.confidence = $conf, r.evidence = $ev
                """, src=rel.source_entity_id, tgt=rel.target_entity_id,
                     weight=rel.weight, conf=rel.confidence, ev=rel.evidence)

        logger.info("Saved decision graph: {}", decision.title)

    # ── Write Conflict ────────────────────────────────────────────────────────

    def save_conflict(self, conflict: Conflict) -> None:
        if not self._driver:
            return
        with self._session() as s:
            s.run("""
                MERGE (c:Conflict {id: $id})
                SET c.severity = $severity,
                    c.description = $desc,
                    c.entity_a = $ea,
                    c.entity_b = $eb,
                    c.similarity_score = $score,
                    c.detected_at = $at
                WITH c
                MATCH (a:Entity {label: $ea}), (b:Entity {label: $eb})
                MERGE (a)-[:CONFLICTS_WITH {conflict_id: $id}]->(b)
            """, id=conflict.id, severity=conflict.severity, desc=conflict.description,
                 ea=conflict.entity_a, eb=conflict.entity_b,
                 score=conflict.similarity_score, at=str(conflict.detected_at))

    # ── Query ─────────────────────────────────────────────────────────────────

    def find_related_entities(self, entity_label: str, depth: int = 2) -> list[dict]:
        if not self._driver:
            return []
        with self._session() as s:
            result = s.run("""
                MATCH path = (e:Entity {label: $label})-[*1..$depth]-(related)
                RETURN DISTINCT related.id AS id,
                       related.label AS label,
                       related.type AS type,
                       length(path) AS hops
                ORDER BY hops
                LIMIT 25
            """, label=entity_label, depth=depth)
            return [dict(r) for r in result]

    def get_decision_graph(self, decision_id: str) -> dict:
        if not self._driver:
            return {"nodes": [], "edges": []}
        with self._session() as s:
            nodes_result = s.run("""
                MATCH (d:Decision {id: $id})-[:CONTAINS]->(e:Entity)
                RETURN e.id AS id, e.label AS label, e.type AS type
            """, id=decision_id)
            edges_result = s.run("""
                MATCH (d:Decision {id: $id})-[:CONTAINS]->(a:Entity)
                MATCH (a)-[r]->(b:Entity)
                WHERE type(r) <> 'CONTAINS'
                RETURN a.id AS source, type(r) AS relation, b.id AS target, r.weight AS weight
            """, id=decision_id)
            return {
                "nodes": [dict(r) for r in nodes_result],
                "edges": [dict(r) for r in edges_result],
            }

    def get_all_conflicts(self) -> list[dict]:
        if not self._driver:
            return []
        with self._session() as s:
            result = s.run("""
                MATCH (c:Conflict)
                RETURN c.id AS id, c.severity AS severity,
                       c.description AS description,
                       c.entity_a AS entity_a, c.entity_b AS entity_b,
                       c.similarity_score AS score
                ORDER BY c.detected_at DESC LIMIT 50
            """)
            return [dict(r) for r in result]

    def shortest_path(self, from_label: str, to_label: str) -> list[str]:
        """Returns shortest path between two entities as a list of labels."""
        if not self._driver:
            return []
        with self._session() as s:
            result = s.run("""
                MATCH p = shortestPath(
                    (a:Entity {label: $from})-[*]-(b:Entity {label: $to})
                )
                RETURN [n IN nodes(p) | COALESCE(n.label, n.title)] AS path
                LIMIT 1
            """, **{"from": from_label, "to": to_label})
            row = result.single()
            return row["path"] if row else []
