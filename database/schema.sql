CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  plan_type VARCHAR(50), -- 'starter', 'professional', 'enterprise'
  monthly_budget DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members (support agents)
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department VARCHAR(50) NOT NULL, -- 'support', 'finance', 'technical'
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket types
CREATE TABLE ticket_types (
  id SERIAL PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
  avg_resolution_hours INTEGER
);

-- Tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  assigned_to INTEGER REFERENCES team_members(id),
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Ticket messages
CREATE TABLE ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  from_client BOOLEAN DEFAULT FALSE, -- true if from client, false if from team
  from_team_member_id INTEGER REFERENCES team_members(id),
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client feedback on resolved tickets
CREATE TABLE ticket_feedback (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) UNIQUE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  amount_usd DECIMAL(10, 2) NOT NULL,
  payment_type VARCHAR(50) NOT NULL, -- 'subscription', 'top-up', 'one-time'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_client_id ON tickets(client_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_resolved_at ON tickets(resolved_at);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);