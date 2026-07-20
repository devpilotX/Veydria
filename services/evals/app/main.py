"""AgentProof evaluation service.

A small FastAPI service that scores an agent for bias, hallucination, prompt
injection, safety, and policy violations. The web app calls POST /evaluate over
HTTP and stores the result. Authentication is a shared key in the
X-API-Key header, set with EVALS_SERVICE_API_KEY.
"""

from __future__ import annotations

import os

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .scoring import score_evaluation

app = FastAPI(title="AgentProof Evals", version="0.1.0")

EVAL_TYPES = {"bias", "hallucination", "prompt_injection", "safety", "policy"}


class EvaluateRequest(BaseModel):
    type: str = Field(..., description="One of bias, hallucination, prompt_injection, safety, policy")
    agent_name: str
    system_prompt: str | None = None
    model: str | None = None
    threshold: float = 70.0


class CaseModel(BaseModel):
    input: str
    output: str
    passed: bool
    score: float
    rationale: str
    expected: str | None = None


class EvaluateResponse(BaseModel):
    type: str
    score: float
    passed: bool
    threshold: float
    summary: str
    model_used: str
    cases: list[CaseModel]


def _check_key(provided: str | None) -> None:
    expected = os.environ.get("EVALS_SERVICE_API_KEY")
    # If no key is configured, allow local calls. In production, always set one.
    if expected and provided != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing service key.")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(
    request: EvaluateRequest,
    x_api_key: str | None = Header(default=None),
) -> EvaluateResponse:
    _check_key(x_api_key)

    if request.type not in EVAL_TYPES:
        raise HTTPException(status_code=422, detail=f"Unknown evaluation type: {request.type}")

    result = score_evaluation(
        eval_type=request.type,
        agent_name=request.agent_name,
        system_prompt=request.system_prompt,
        threshold=request.threshold,
    )

    model_used = request.model or ("openai" if os.environ.get("OPENAI_API_KEY") else "offline-heuristic")

    return EvaluateResponse(
        type=request.type,
        score=result.score,
        passed=result.passed,
        threshold=request.threshold,
        summary=result.summary,
        model_used=model_used,
        cases=[
            CaseModel(
                input=c.input,
                output=c.output,
                passed=c.passed,
                score=c.score,
                rationale=c.rationale,
                expected=c.expected,
            )
            for c in result.cases
        ],
    )
