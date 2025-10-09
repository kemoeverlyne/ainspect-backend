CREATE TABLE IF NOT EXISTS feature_flags (
  key varchar PRIMARY KEY,
  description text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

INSERT INTO feature_flags (key, description, enabled) VALUES 
('advanced_analytics', 'Enable advanced analytics features and reporting capabilities', true),
('ai_photo_analysis', 'Enable AI-powered photo analysis for defect detection', true),
('contractor_marketplace', 'Enable contractor marketplace and lead generation features', true),
('google_calendar_sync', 'Enable Google Calendar integration for scheduling', false),
('sms_notifications', 'Enable SMS notification capabilities', false),
('webhook_integrations', 'Enable webhook integrations for third-party services', false),
('multi_language_support', 'Enable multi-language interface support', false),
('advanced_reporting', 'Enable advanced PDF report customization features', true)
ON CONFLICT (key) DO NOTHING;
