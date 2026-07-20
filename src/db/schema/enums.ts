import { pgEnum } from 'drizzle-orm/pg-core';

// Membership and access
export const membershipRole = pgEnum('membership_role', ['owner', 'admin', 'member', 'viewer']);

// Billing
export const planTier = pgEnum('plan_tier', ['free', 'starter', 'growth', 'scale', 'enterprise']);
export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete'
]);

// AI systems
export const riskTier = pgEnum('risk_tier', [
  'prohibited',
  'high',
  'limited',
  'minimal',
  'unknown'
]);
export const systemLifecycle = pgEnum('system_lifecycle', [
  'development',
  'staging',
  'production',
  'retired'
]);
export const systemStatus = pgEnum('system_status', ['draft', 'active', 'archived']);

// Agents
export const agentType = pgEnum('agent_type', [
  'assistant',
  'rag',
  'autonomous',
  'classifier',
  'generator',
  'workflow'
]);
export const agentStatus = pgEnum('agent_status', ['active', 'paused', 'archived']);

// Regulations and obligations
export const regulationCode = pgEnum('regulation_code', ['eu_ai_act', 'nist_ai_rmf', 'iso_42001']);
export const obligationStatus = pgEnum('obligation_status', [
  'not_started',
  'in_progress',
  'met',
  'not_applicable'
]);
export const obligationCategory = pgEnum('obligation_category', [
  'risk_management',
  'data_governance',
  'transparency',
  'human_oversight',
  'technical_documentation',
  'accuracy_robustness',
  'record_keeping',
  'cybersecurity',
  'quality_management',
  'post_market_monitoring'
]);

// Shared severity scale
export const severity = pgEnum('severity', ['info', 'low', 'medium', 'high', 'critical']);

// Evaluations
export const evaluationType = pgEnum('evaluation_type', [
  'bias',
  'hallucination',
  'prompt_injection',
  'safety',
  'policy'
]);
export const evaluationStatus = pgEnum('evaluation_status', [
  'queued',
  'running',
  'passed',
  'failed',
  'error'
]);

// Monitoring
export const monitoringEventType = pgEnum('monitoring_event_type', [
  'invocation',
  'output',
  'tool_call',
  'error',
  'policy_check',
  'decision'
]);

// Alerts
export const alertType = pgEnum('alert_type', [
  'anomaly',
  'policy_breach',
  'evaluation_failure',
  'drift',
  'integrity'
]);
export const alertStatus = pgEnum('alert_status', ['open', 'acknowledged', 'resolved']);
export const alertSource = pgEnum('alert_source', [
  'monitoring',
  'evaluation',
  'system',
  'integrity'
]);

// Documents
export const documentType = pgEnum('document_type', [
  'risk_assessment',
  'annex_iv',
  'model_card',
  'audit_report',
  'dpia',
  'conformity_declaration'
]);
export const documentStatus = pgEnum('document_status', ['draft', 'final', 'archived']);

// Audit log
export const auditActorType = pgEnum('audit_actor_type', ['user', 'system', 'agent', 'api_key']);
