"""
LLM router.

Every provider is reached through its OpenAI-compatible endpoint, so one
client class (ChatOpenAI) covers local Ollama, Groq and Gemini:

    basic tier    → Ollama (private, local) → Groq → Gemini
    premium tier  → Groq → Gemini → Ollama
    vision        → Gemini

A provider that fails at connection level is skipped for LLM_COOLDOWN_S
seconds, so a stopped Ollama does not add a failed attempt to every call.
"""

from __future__ import annotations

import json
import re
import threading
import time
from typing import Any, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage

import config


class LLMUnavailable(RuntimeError):
    """No configured provider could answer."""


def ollama_model_for(user_ram: float) -> str:
    """Smaller quantisation for low-memory devices, full precision for big ones."""
    if config.OLLAMA_MODEL:
        return config.OLLAMA_MODEL
    if user_ram < 4:
        return "llama3.2:1b"
    if user_ram >= 16:
        return "llama3.2:3b-instruct-fp16"
    return "llama3.2"


def to_messages(messages: list) -> list[BaseMessage]:
    """Accepts LangChain messages or plain {"role", "content"} dicts."""
    out: list[BaseMessage] = []
    for m in messages:
        if isinstance(m, BaseMessage):
            out.append(m)
        elif m["role"] == "system":
            out.append(SystemMessage(content=m["content"]))
        elif m["role"] == "assistant":
            out.append(AIMessage(content=m["content"]))
        else:
            out.append(HumanMessage(content=m["content"]))
    return out


def parse_json(text: str) -> Optional[dict]:
    """Best-effort JSON object extraction from a model reply."""
    if not text:
        return None
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else None
    except json.JSONDecodeError:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            value = json.loads(text[start:end + 1])
            return value if isinstance(value, dict) else None
        except json.JSONDecodeError:
            return None
    return None


class LLMRouter:
    def __init__(self) -> None:
        self._clients: dict[tuple, Any] = {}
        self._down_until: dict[str, float] = {}
        self._lock = threading.Lock()

    # ── provider table ───────────────────────────────────────────────────
    def _spec(self, provider: str, user_ram: float) -> Optional[dict]:
        if provider == "ollama":
            return {"base_url": f"{config.OLLAMA_HOST}/v1", "api_key": "ollama", "model": ollama_model_for(user_ram)}
        if provider == "groq" and config.GROQ_API_KEY:
            spec = {"base_url": "https://api.groq.com/openai/v1", "api_key": config.GROQ_API_KEY, "model": config.GROQ_MODEL}
            if config.GROQ_REASONING_EFFORT:
                # Reasoning tokens count against max_tokens, so leave room for them.
                spec["extra"] = {"reasoning_effort": config.GROQ_REASONING_EFFORT}
                spec["token_headroom"] = 600
            return spec
        if provider == "gemini" and config.GEMINI_API_KEY:
            return {
                "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
                "api_key": config.GEMINI_API_KEY,
                "model": config.GEMINI_MODEL,
                # Gemini "thinking" tokens count against max_tokens; without
                # room for them a reply can be cut off before it starts.
                "token_headroom": 2000,
            }
        return None

    def order(self, tier: str = "basic", vision: bool = False) -> list[str]:
        if vision:
            return ["gemini"]
        return ["groq", "gemini", "ollama"] if tier == "premium" else ["ollama", "groq", "gemini"]

    def _client(self, spec: dict, temperature: float, max_tokens: int, json_mode: bool):
        from langchain_openai import ChatOpenAI

        key = (spec["base_url"], spec["model"], temperature, max_tokens, json_mode)
        with self._lock:
            if key not in self._clients:
                kwargs: dict[str, Any] = dict(spec.get("extra", {}))
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}
                self._clients[key] = ChatOpenAI(
                    base_url=spec["base_url"],
                    api_key=spec["api_key"],
                    model=spec["model"],
                    temperature=temperature,
                    max_tokens=max_tokens + spec.get("token_headroom", 0),
                    timeout=config.LLM_TIMEOUT_S,
                    max_retries=1,
                    model_kwargs=kwargs,
                )
            return self._clients[key]

    # ── calls ────────────────────────────────────────────────────────────
    def invoke(
        self,
        messages: list,
        *,
        tier: str = "basic",
        user_ram: float = 8,
        temperature: float = 0.3,
        max_tokens: int = 700,
        json_mode: bool = False,
        vision: bool = False,
        tools: Optional[list] = None,
    ) -> tuple[AIMessage, str]:
        """Returns (reply message, provider name). Raises LLMUnavailable."""
        lc_messages = to_messages(messages)
        errors: list[str] = []
        for provider in self.order(tier, vision):
            spec = self._spec(provider, user_ram)
            if spec is None:
                continue
            if self._down_until.get(provider, 0) > time.time():
                errors.append(f"{provider}: cooling down")
                continue
            try:
                client = self._client(spec, temperature, max_tokens, json_mode)
                runnable = client.bind_tools(tools) if tools else client
                reply = runnable.invoke(lc_messages)
                return reply, provider
            except Exception as exc:  # noqa: BLE001 - any provider error means "try the next one"
                name = type(exc).__name__
                errors.append(f"{provider}: {name}")
                # Unreachable host, wrong model name or bad key: retrying on the
                # very next call cannot help, so skip this provider for a while.
                if any(part in name for part in ("Connection", "Timeout", "NotFound", "Authentication", "PermissionDenied")):
                    self._down_until[provider] = time.time() + config.LLM_COOLDOWN_S
                print(f"LLM provider '{provider}' failed ({name}); trying next.")
        raise LLMUnavailable("; ".join(errors) or "no LLM provider is configured")

    def text(self, messages: list, **kwargs) -> tuple[str, str]:
        reply, provider = self.invoke(messages, **kwargs)
        content = reply.content if isinstance(reply.content, str) else str(reply.content)
        return content.strip(), provider

    def json(self, messages: list, **kwargs) -> tuple[Optional[dict], str]:
        """JSON-mode call. Returns (parsed dict or None, provider)."""
        kwargs.setdefault("temperature", 0.0)
        text, provider = self.text(messages, json_mode=True, **kwargs)
        return parse_json(text), provider

    def describe_image(self, image_b64: str, mime: str, prompt: str) -> tuple[str, str]:
        message = HumanMessage(content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{image_b64}"}},
        ])
        return self.text([message], vision=True, temperature=0.2, max_tokens=500)

    def status(self) -> dict:
        now = time.time()
        return {
            "ollama": {"configured": True, "host": config.OLLAMA_HOST, "cooling_down": self._down_until.get("ollama", 0) > now},
            "groq": {"configured": bool(config.GROQ_API_KEY), "model": config.GROQ_MODEL, "cooling_down": self._down_until.get("groq", 0) > now},
            "gemini": {"configured": bool(config.GEMINI_API_KEY), "model": config.GEMINI_MODEL, "cooling_down": self._down_until.get("gemini", 0) > now},
        }


__all__ = ["LLMRouter", "LLMUnavailable", "parse_json", "to_messages", "ollama_model_for", "ToolMessage"]
