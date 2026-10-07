"""
The consult graph.

    prepare ─► screen ─┬─► emergency ────────────────────────────────────────────┐
                       ├─► (blocked) ────────────────────────────────────────────┤
                       └─► [vision] ─► analyze ─┬─► emergency ───────────────────┤
                                                ├─► ask ─────────────────────────┼─► verify ─► [review] ─► finalize
                                                └─► research ⇄ refine            │
                                                       └─► [risk_tools] ─► assess ┘
    verify can send a draft back once; review pauses the run for a clinician.

One HTTP turn is one run of the graph. State is saved per thread by the
checkpointer, so the next turn continues where this one stopped.
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from . import nodes as n
from .state import ConsultState


def build_graph(deps: n.Deps, checkpointer=None):
    fns = n.make_nodes(deps)
    graph = StateGraph(ConsultState)
    for name, fn in fns.items():
        graph.add_node(name, fn)

    graph.add_edge(START, "prepare")
    graph.add_conditional_edges("prepare", n.route_after_prepare, ["screen", "finalize"])
    graph.add_conditional_edges("screen", n.route_after_screen, ["emergency", "finalize", "vision", "analyze"])
    graph.add_edge("vision", "analyze")
    graph.add_conditional_edges("analyze", n.route_after_analyze, ["emergency", "ask", "research"])
    graph.add_edge("emergency", "finalize")
    # Research loop: search every planned topic; a search that finds nothing
    # is reworded once (refine) and tried again.
    graph.add_conditional_edges("research", n.route_after_research, ["refine", "risk_tools", "assess"])
    graph.add_conditional_edges("refine", n.route_after_refine, ["research", "risk_tools", "assess"])
    graph.add_edge("risk_tools", "assess")
    graph.add_edge("ask", "verify")
    graph.add_conditional_edges("assess", n.route_after_assess, ["verify", "finalize"])
    graph.add_conditional_edges("verify", n.route_after_verify, ["ask", "assess", "review", "finalize"])
    graph.add_edge("review", "finalize")
    graph.add_edge("finalize", END)

    return graph.compile(checkpointer=checkpointer)
