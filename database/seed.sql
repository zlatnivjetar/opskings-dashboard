TRUNCATE TABLE ticket_feedback, ticket_messages, tickets, payments, ticket_types, team_members, clients RESTART IDENTITY CASCADE;
INSERT INTO clients (client_name, email, status, plan_type, monthly_budget, created_at) VALUES
('TechStart Inc', 'admin@techstart.com', 'active', 'professional', 5000.00, '2025-01-15 10:00:00+00'),
('GrowthCo', 'contact@growthco.io', 'active', 'enterprise', 15000.00, '2025-01-20 14:30:00+00'),
('SmallBiz LLC', 'owner@smallbiz.com', 'active', 'starter', 1000.00, '2025-02-01 09:00:00+00'),
('MegaCorp', 'support@megacorp.com', 'active', 'enterprise', 25000.00, '2025-02-05 11:00:00+00'),
('StartupHub', 'hello@startuphub.co', 'active', 'professional', 7500.00, '2025-02-10 16:00:00+00'),
('EcomStore', 'team@ecomstore.com', 'active', 'professional', 6000.00, '2025-02-15 10:30:00+00'),
('DigitalAgency', 'ops@digitalagency.com', 'active', 'enterprise', 20000.00, '2025-03-01 08:00:00+00'),
('LocalShop', 'info@localshop.com', 'inactive', 'starter', 800.00, '2025-03-05 12:00:00+00'),
('GlobalTech', 'admin@globaltech.com', 'active', 'enterprise', 18000.00, '2025-03-10 15:00:00+00'),
('QuickStart', 'contact@quickstart.io', 'active', 'starter', 1200.00, '2025-03-15 11:30:00+00'),
('InnovateLabs', 'team@innovatelabs.com', 'active', 'professional', 8000.00, '2025-03-20 09:45:00+00'),
('RetailPro', 'support@retailpro.com', 'active', 'professional', 5500.00, '2025-04-01 10:00:00+00'),
('CloudServices', 'hello@cloudservices.io', 'active', 'enterprise', 22000.00, '2025-04-05 14:00:00+00'),
('WebStudio', 'info@webstudio.com', 'active', 'starter', 1500.00, '2025-04-10 16:30:00+00'),
('DataCorp', 'admin@datacorp.com', 'active', 'enterprise', 30000.00, '2025-04-15 09:00:00+00'),
('MarketingPro', 'team@marketingpro.com', 'active', 'professional', 6500.00, '2025-05-01 11:00:00+00'),
('FinanceHub', 'contact@financehub.io', 'active', 'enterprise', 28000.00, '2025-05-05 13:00:00+00'),
('CreativeStudio', 'hello@creativestudio.com', 'active', 'professional', 5000.00, '2025-05-10 15:30:00+00'),
('TechSolutions', 'support@techsolutions.com', 'active', 'professional', 7000.00, '2025-05-15 10:15:00+00'),
('StartupX', 'team@startupx.io', 'active', 'starter', 1800.00, '2025-06-01 09:30:00+00'),
('EnterpriseOne', 'admin@enterpriseone.com', 'active', 'enterprise', 35000.00, '2025-06-05 14:45:00+00'),
('AgileTeam', 'contact@agileteam.com', 'active', 'professional', 6200.00, '2025-06-10 11:20:00+00'),
('SaasPlatform', 'info@saasplatform.io', 'active', 'enterprise', 24000.00, '2025-06-15 16:00:00+00'),
('DevShop', 'hello@devshop.com', 'active', 'starter', 1400.00, '2025-06-20 10:45:00+00'),
('ScaleUp', 'team@scaleup.io', 'active', 'professional', 9000.00, '2025-07-01 12:00:00+00'),
('ProductCo', 'support@productco.com', 'active', 'enterprise', 26000.00, '2025-07-05 09:15:00+00'),
('DesignHub', 'admin@designhub.com', 'active', 'professional', 5800.00, '2025-07-10 14:30:00+00'),
('MediaGroup', 'contact@mediagroup.io', 'active', 'enterprise', 21000.00, '2025-07-15 11:45:00+00'),
('BizStarter', 'hello@bizstarter.com', 'active', 'starter', 1100.00, '2025-08-01 10:00:00+00'),
('GrowthEngine', 'team@growthengine.io', 'active', 'professional', 7200.00, '2025-08-05 15:00:00+00'),
('PremiumCo', 'support@premiumco.com', 'active', 'enterprise', 32000.00, '2025-08-10 09:30:00+00'),
('FastTrack', 'admin@fasttrack.com', 'active', 'professional', 6800.00, '2025-08-15 13:15:00+00'),
('InnovateCo', 'contact@innovateco.io', 'active', 'professional', 5400.00, '2025-08-20 16:45:00+00'),
('BetaLabs', 'hello@betalabs.com', 'inactive', 'starter', 900.00, '2025-09-01 10:30:00+00'),
('AlphaGroup', 'team@alphagroup.io', 'active', 'enterprise', 27000.00, '2025-09-05 14:00:00+00'),
('Velocity', 'support@velocity.com', 'active', 'professional', 6100.00, '2025-09-10 11:30:00+00'),
('NextGen', 'admin@nextgen.io', 'active', 'enterprise', 23000.00, '2025-09-15 15:45:00+00'),
('QuickGrow', 'contact@quickgrow.com', 'active', 'starter', 1600.00, '2025-09-20 09:00:00+00'),
('ProSolutions', 'hello@prosolutions.io', 'active', 'professional', 7800.00, '2025-10-01 12:30:00+00'),
('UltraCorp', 'team@ultracorp.com', 'active', 'enterprise', 29000.00, '2025-10-05 10:15:00+00'),
('SwiftStart', 'support@swiftstart.com', 'active', 'starter', 1300.00, '2025-10-10 14:45:00+00'),
('PowerHub', 'admin@powerhub.io', 'active', 'professional', 6700.00, '2025-10-15 11:00:00+00'),
('EliteServices', 'contact@eliteservices.com', 'active', 'enterprise', 31000.00, '2025-10-20 16:30:00+00'),
('RapidGrowth', 'hello@rapidgrowth.io', 'active', 'professional', 5900.00, '2025-10-25 09:45:00+00'),
('MicroBiz', 'team@microbiz.com', 'active', 'starter', 1700.00, '2025-11-01 13:00:00+00'),
('MaxCorp', 'support@maxcorp.io', 'active', 'enterprise', 33000.00, '2025-11-05 10:30:00+00'),
('AgileWorks', 'admin@agileworks.com', 'active', 'professional', 6400.00, '2025-11-08 15:15:00+00'),
('TurboStart', 'contact@turbostart.io', 'active', 'starter', 2000.00, '2025-11-10 11:45:00+00'),
('PeakPerformance', 'hello@peakperformance.com', 'active', 'professional', 8500.00, '2025-11-11 14:00:00+00'),
('ZenithCo', 'team@zenithco.io', 'active', 'enterprise', 34000.00, '2025-11-12 09:30:00+00');
INSERT INTO team_members (username, email, department, status, created_at) VALUES
('john_smith', 'john.smith@company.com', 'support', 'active', '2023-06-01 09:00:00+00'),
('sarah_jones', 'sarah.jones@company.com', 'support', 'active', '2023-07-15 09:00:00+00'),
('mike_wilson', 'mike.wilson@company.com', 'support', 'active', '2023-08-01 09:00:00+00'),
('emily_brown', 'emily.brown@company.com', 'technical', 'active', '2023-09-01 09:00:00+00'),
('david_lee', 'david.lee@company.com', 'support', 'active', '2023-10-01 09:00:00+00'),
('lisa_garcia', 'lisa.garcia@company.com', 'finance', 'active', '2023-11-01 09:00:00+00'),
('james_taylor', 'james.taylor@company.com', 'support', 'active', '2024-01-15 09:00:00+00'),
('anna_martinez', 'anna.martinez@company.com', 'technical', 'active', '2024-02-01 09:00:00+00'),
('robert_johnson', 'robert.johnson@company.com', 'support', 'active', '2024-03-01 09:00:00+00'),
('maria_rodriguez', 'maria.rodriguez@company.com', 'support', 'active', '2024-04-01 09:00:00+00'),
('chris_anderson', 'chris.anderson@company.com', 'technical', 'active', '2024-05-01 09:00:00+00'),
('jessica_thomas', 'jessica.thomas@company.com', 'support', 'active', '2024-06-01 09:00:00+00'),
('daniel_white', 'daniel.white@company.com', 'finance', 'active', '2024-07-01 09:00:00+00'),
('olivia_harris', 'olivia.harris@company.com', 'support', 'active', '2024-08-01 09:00:00+00'),
('william_clark', 'william.clark@company.com', 'technical', 'active', '2024-09-01 09:00:00+00');
INSERT INTO ticket_types (type_name, department, priority, avg_resolution_hours) VALUES
('Account Setup', 'support', 'high', 4),
('Billing Question', 'finance', 'medium', 6),
('Technical Issue', 'technical', 'urgent', 2),
('Feature Request', 'support', 'low', 48),
('Bug Report', 'technical', 'high', 8),
('Account Suspension', 'support', 'urgent', 1),
('Payment Failed', 'finance', 'high', 3),
('Integration Help', 'technical', 'medium', 12),
('General Question', 'support', 'low', 24),
('Performance Issue', 'technical', 'high', 6),
('Refund Request', 'finance', 'medium', 8),
('Account Upgrade', 'support', 'medium', 4),
('Security Concern', 'technical', 'urgent', 1),
('Data Export', 'support', 'low', 24);

DO $$
DECLARE
  v_month INTEGER;
  v_base_tickets INTEGER;
  v_ticket_count INTEGER;
  v_client_id INTEGER;
  v_team_member_id INTEGER;
  v_ticket_type_id INTEGER;
  v_created_at TIMESTAMP;
  v_resolved_at TIMESTAMP;
  v_closed_at TIMESTAMP;
  v_status TEXT;
  v_priority TEXT;
BEGIN
  FOR v_month IN 1..11 LOOP
    v_base_tickets := 3060 + (v_month * 140);
    
    FOR v_ticket_count IN 1..v_base_tickets LOOP
      v_client_id := FLOOR(RANDOM() * LEAST(v_month * 5, 50) + 1)::INTEGER;
      
      v_team_member_id := FLOOR(RANDOM() * 15 + 1)::INTEGER;
      
      v_ticket_type_id := FLOOR(RANDOM() * 14 + 1)::INTEGER;
      
      v_created_at := ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-01')::TIMESTAMP + 
                      (RANDOM() * INTERVAL '28 days');
      
      CASE 
        WHEN RANDOM() < 0.70 THEN 
          v_status := 'resolved';
          v_resolved_at := v_created_at + (RANDOM() * INTERVAL '48 hours');
          v_closed_at := NULL;
        WHEN RANDOM() < 0.85 THEN 
          v_status := 'in_progress';
          v_resolved_at := NULL;
          v_closed_at := NULL;
        ELSE 
          v_status := 'open';
          v_resolved_at := NULL;
          v_closed_at := NULL;
      END CASE;
      
      CASE 
        WHEN RANDOM() < 0.10 THEN v_priority := 'urgent';
        WHEN RANDOM() < 0.35 THEN v_priority := 'high';
        WHEN RANDOM() < 0.70 THEN v_priority := 'medium';
        ELSE v_priority := 'low';
      END CASE;
      
      INSERT INTO tickets (
        client_id, assigned_to, ticket_type_id, status, priority, 
        title, created_at, resolved_at, closed_at
      ) VALUES (
        v_client_id, v_team_member_id, v_ticket_type_id, v_status, v_priority,
        'Ticket regarding ' || (SELECT type_name FROM ticket_types WHERE id = v_ticket_type_id),
        v_created_at, v_resolved_at, v_closed_at
      );
    END LOOP;
  END LOOP;
END $$;

INSERT INTO ticket_messages (ticket_id, from_client, from_team_member_id, message_text, created_at)
SELECT 
  t.id,
  TRUE,
  NULL,
  'Hello, I need help with ' || tt.type_name || '. This is urgent.',
  t.created_at + INTERVAL '5 minutes'
FROM tickets t
JOIN ticket_types tt ON t.ticket_type_id = tt.id;

INSERT INTO ticket_messages (ticket_id, from_client, from_team_member_id, message_text, created_at)
SELECT 
  t.id,
  FALSE,
  t.assigned_to,
  'Thank you for contacting us. I''ll look into this right away.',
  t.created_at + INTERVAL '30 minutes'
FROM tickets t
WHERE t.assigned_to IS NOT NULL;

INSERT INTO ticket_messages (ticket_id, from_client, from_team_member_id, message_text, created_at)
SELECT 
  t.id,
  FALSE,
  t.assigned_to,
  'This issue has been resolved. Please let me know if you need anything else.',
  t.resolved_at - INTERVAL '15 minutes'
FROM tickets t
WHERE t.resolved_at IS NOT NULL;

INSERT INTO ticket_feedback (ticket_id, rating, feedback_text, created_at)
SELECT 
  t.id,
  FLOOR(RANDOM() * 3 + 3)::INTEGER,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Great support!'
    WHEN RANDOM() < 0.6 THEN 'Very helpful and quick response.'
    ELSE 'Issue resolved satisfactorily.'
  END,
  t.resolved_at + INTERVAL '1 hour'
FROM tickets t
WHERE t.status = 'resolved' AND RANDOM() < 0.6;

INSERT INTO ticket_feedback (ticket_id, rating, feedback_text, created_at)
SELECT 
  t.id,
  FLOOR(RANDOM() * 2 + 1)::INTEGER,
  CASE 
    WHEN RANDOM() < 0.5 THEN 'Took too long to resolve.'
    ELSE 'Not satisfied with the solution.'
  END,
  t.resolved_at + INTERVAL '1 hour'
FROM tickets t
WHERE t.status = 'resolved' 
  AND t.id NOT IN (SELECT ticket_id FROM ticket_feedback)
  AND RANDOM() < 0.15;

INSERT INTO payments (client_id, amount_usd, payment_type, status, paid_at, created_at)
SELECT 
  c.id,
  CASE c.plan_type
    WHEN 'starter' THEN 99.00
    WHEN 'professional' THEN 299.00
    WHEN 'enterprise' THEN 999.00
  END,
  'subscription',
  CASE 
    WHEN RANDOM() < 0.95 THEN 'completed'
    WHEN RANDOM() < 0.98 THEN 'failed'
    ELSE 'pending'
  END,
  generate_series::TIMESTAMP + INTERVAL '1 day',
  generate_series::TIMESTAMP
FROM clients c
CROSS JOIN generate_series(
  DATE_TRUNC('month', c.created_at),
  '2025-11-01'::TIMESTAMP,
  '1 month'::INTERVAL
)
WHERE c.status = 'active'
  AND generate_series >= c.created_at;

INSERT INTO payments (client_id, amount_usd, payment_type, status, paid_at, created_at)
SELECT 
  client_id,
  FLOOR(RANDOM() * 4 + 1) * 500.00,
  'top-up',
  'completed',
  created_date + INTERVAL '2 hours',
  created_date
FROM (
  SELECT 
    id AS client_id,
    created_at + (RANDOM() * (NOW() - created_at)) AS created_date
  FROM clients
  WHERE RANDOM() < 0.4
) sub;

INSERT INTO payments (client_id, amount_usd, payment_type, status, paid_at, created_at)
SELECT 
  client_id,
  -amount_usd,
  'subscription',
  'refunded',
  paid_at,
  paid_at + INTERVAL '5 days'
FROM payments
WHERE RANDOM() < 0.02
  AND status = 'completed'
LIMIT 10;

END TRANSACTION;

SELECT 'Total Clients:' AS metric, COUNT(*)::TEXT AS value FROM clients
UNION ALL
SELECT 'Total Team Members:', COUNT(*)::TEXT FROM team_members
UNION ALL
SELECT 'Total Ticket Types:', COUNT(*)::TEXT FROM ticket_types
UNION ALL
SELECT 'Total Tickets:', COUNT(*)::TEXT FROM tickets
UNION ALL
SELECT 'Total Messages:', COUNT(*)::TEXT FROM ticket_messages
UNION ALL
SELECT 'Total Feedback:', COUNT(*)::TEXT FROM ticket_feedback
UNION ALL
SELECT 'Total Payments:', COUNT(*)::TEXT FROM payments;