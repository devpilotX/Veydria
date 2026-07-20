CREATE TYPE "public"."agent_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('assistant', 'rag', 'autonomous', 'classifier', 'generator', 'workflow');--> statement-breakpoint
CREATE TYPE "public"."alert_source" AS ENUM('monitoring', 'evaluation', 'system', 'integrity');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('open', 'acknowledged', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('anomaly', 'policy_breach', 'evaluation_failure', 'drift', 'integrity');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('user', 'system', 'agent', 'api_key');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'final', 'archived');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('risk_assessment', 'annex_iv', 'model_card', 'audit_report', 'dpia', 'conformity_declaration');--> statement-breakpoint
CREATE TYPE "public"."evaluation_status" AS ENUM('queued', 'running', 'passed', 'failed', 'error');--> statement-breakpoint
CREATE TYPE "public"."evaluation_type" AS ENUM('bias', 'hallucination', 'prompt_injection', 'safety', 'policy');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."monitoring_event_type" AS ENUM('invocation', 'output', 'tool_call', 'error', 'policy_check', 'decision');--> statement-breakpoint
CREATE TYPE "public"."obligation_category" AS ENUM('risk_management', 'data_governance', 'transparency', 'human_oversight', 'technical_documentation', 'accuracy_robustness', 'record_keeping', 'cybersecurity', 'quality_management', 'post_market_monitoring');--> statement-breakpoint
CREATE TYPE "public"."obligation_status" AS ENUM('not_started', 'in_progress', 'met', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'starter', 'growth', 'scale', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."regulation_code" AS ENUM('eu_ai_act', 'nist_ai_rmf', 'iso_42001');--> statement-breakpoint
CREATE TYPE "public"."risk_tier" AS ENUM('prohibited', 'high', 'limited', 'minimal', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."system_lifecycle" AS ENUM('development', 'staging', 'production', 'retired');--> statement-breakpoint
CREATE TYPE "public"."system_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"created_by_user_id" uuid,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan" "plan_tier" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"seats" integer DEFAULT 1 NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_system_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "agent_type" DEFAULT 'assistant' NOT NULL,
	"model_provider" text,
	"model_name" text,
	"system_prompt" text,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"external_id" text,
	"last_seen_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_systems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"purpose" text,
	"domain" text,
	"deployment_context" text,
	"actor_role" text DEFAULT 'provider' NOT NULL,
	"lifecycle" "system_lifecycle" DEFAULT 'development' NOT NULL,
	"status" "system_status" DEFAULT 'draft' NOT NULL,
	"risk_tier" "risk_tier" DEFAULT 'unknown' NOT NULL,
	"classified_at" timestamp with time zone,
	"classification_rationale" text,
	"owner_name" text,
	"owner_email" text,
	"metadata" jsonb,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_system_id" uuid NOT NULL,
	"regulation_code" "regulation_code" NOT NULL,
	"clause_ref" text NOT NULL,
	"regulation_clause_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" "obligation_category" DEFAULT 'risk_management' NOT NULL,
	"severity" "severity" DEFAULT 'medium' NOT NULL,
	"status" "obligation_status" DEFAULT 'not_started' NOT NULL,
	"evidence_summary" text,
	"owner" text,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulation_clauses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regulation_id" uuid NOT NULL,
	"code" "regulation_code" NOT NULL,
	"ref" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"category" "obligation_category",
	"embedding" real[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "regulation_code" NOT NULL,
	"name" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"version" text,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "evaluation_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"input" text NOT NULL,
	"expected" text,
	"output" text,
	"passed" boolean,
	"score" real,
	"rationale" text,
	"embedding" real[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"type" "evaluation_type" NOT NULL,
	"status" "evaluation_status" DEFAULT 'queued' NOT NULL,
	"score" real,
	"threshold" real DEFAULT 70 NOT NULL,
	"passed" boolean,
	"summary" text,
	"details" jsonb,
	"model_used" text,
	"triggered_by_user_id" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid,
	"ai_system_id" uuid,
	"type" "alert_type" NOT NULL,
	"severity" "severity" DEFAULT 'medium' NOT NULL,
	"source" "alert_source" DEFAULT 'monitoring' NOT NULL,
	"status" "alert_status" DEFAULT 'open' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"acknowledged_by_user_id" uuid,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"event_type" "monitoring_event_type" DEFAULT 'invocation' NOT NULL,
	"input" text,
	"output" text,
	"metadata" jsonb,
	"latency_ms" integer,
	"tokens_in" integer,
	"tokens_out" integer,
	"cost_usd" real,
	"flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"seq" bigint NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"actor_id" text,
	"actor_label" text,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"data" jsonb,
	"prev_hash" text,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_system_id" uuid,
	"type" "document_type" NOT NULL,
	"title" text NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"content" text NOT NULL,
	"format" text DEFAULT 'markdown' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"generated_by_user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_regulation_clause_id_regulation_clauses_id_fk" FOREIGN KEY ("regulation_clause_id") REFERENCES "public"."regulation_clauses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_clauses" ADD CONSTRAINT "regulation_clauses_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_cases" ADD CONSTRAINT "evaluation_cases_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_cases" ADD CONSTRAINT "evaluation_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_user_id_users_id_fk" FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_events" ADD CONSTRAINT "monitoring_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_events" ADD CONSTRAINT "monitoring_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_org_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_unique" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agents_org_idx" ON "agents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agents_system_idx" ON "agents" USING btree ("ai_system_id");--> statement-breakpoint
CREATE INDEX "ai_systems_org_idx" ON "ai_systems" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ai_systems_risk_idx" ON "ai_systems" USING btree ("organization_id","risk_tier");--> statement-breakpoint
CREATE INDEX "obligations_org_idx" ON "obligations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "obligations_system_idx" ON "obligations" USING btree ("ai_system_id");--> statement-breakpoint
CREATE INDEX "obligations_status_idx" ON "obligations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "regulation_clauses_reg_idx" ON "regulation_clauses" USING btree ("regulation_id");--> statement-breakpoint
CREATE INDEX "evaluation_cases_eval_idx" ON "evaluation_cases" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "evaluations_org_idx" ON "evaluations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "evaluations_agent_idx" ON "evaluations" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "evaluations_type_idx" ON "evaluations" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "alerts_org_idx" ON "alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "alerts_status_idx" ON "alerts" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "monitoring_events_org_time_idx" ON "monitoring_events" USING btree ("organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "monitoring_events_agent_time_idx" ON "monitoring_events" USING btree ("agent_id","occurred_at");--> statement-breakpoint
CREATE INDEX "monitoring_events_flagged_idx" ON "monitoring_events" USING btree ("organization_id","flagged");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_log_org_seq_unique" ON "audit_log" USING btree ("organization_id","seq");--> statement-breakpoint
CREATE INDEX "audit_log_org_time_idx" ON "audit_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_org_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "documents_system_idx" ON "documents" USING btree ("ai_system_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("organization_id","type");