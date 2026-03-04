CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"plan_type" varchar(50),
	"monthly_budget" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"amount_usd" numeric(10, 2) NOT NULL,
	"payment_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"department" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "team_members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ticket_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"rating" integer,
	"feedback_text" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ticket_feedback_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"from_client" boolean DEFAULT false,
	"from_team_member_id" integer,
	"message_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"type_name" varchar(100) NOT NULL,
	"department" varchar(50) NOT NULL,
	"priority" varchar(20),
	"avg_resolution_hours" integer
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"assigned_to" integer,
	"ticket_type_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'open',
	"priority" varchar(20),
	"title" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_feedback" ADD CONSTRAINT "ticket_feedback_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_from_team_member_id_team_members_id_fk" FOREIGN KEY ("from_team_member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_team_members_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_payments_client_status" ON "payments" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "idx_tickets_type_created" ON "tickets" USING btree ("ticket_type_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_tickets_assigned_status" ON "tickets" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "idx_tickets_priority_status" ON "tickets" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "idx_tickets_client_created" ON "tickets" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_tickets_created_status" ON "tickets" USING btree ("created_at","status");