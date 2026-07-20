# @agentproof/mcp

An MCP server that lets an AI agent talk to AgentProof. The agent can report what it does, look up the systems and obligations it belongs to, and verify the audit trail.

## Tools

- `track_agent_event`: record one action or output in the audit trail.
- `list_ai_systems`: list the AI systems in the workspace.
- `get_obligations`: list obligations, optionally for one system.
- `verify_audit_trail`: check that the audit log hash chain is intact.

## Run

From the repository root, so dependencies resolve:

```bash
AGENTPROOF_API_KEY=ap_live_... AGENTPROOF_BASE_URL=http://localhost:3000 \
  pnpm exec tsx mcp/src/index.ts
```

## Use it from an MCP client

Point your client at the command above. For example, in a client that reads a JSON config:

```json
{
  "mcpServers": {
    "agentproof": {
      "command": "pnpm",
      "args": ["exec", "tsx", "mcp/src/index.ts"],
      "env": {
        "AGENTPROOF_API_KEY": "ap_live_...",
        "AGENTPROOF_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## License

MIT
