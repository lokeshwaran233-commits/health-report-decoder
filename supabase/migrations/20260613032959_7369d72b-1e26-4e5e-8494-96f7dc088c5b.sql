
-- 1) Restrict public SELECT on activity_events to truly anonymized rows
DROP POLICY IF EXISTS "Public anonymized recent feed" ON public.activity_events;

CREATE POLICY "Public anonymized recent feed"
ON public.activity_events
FOR SELECT
TO anon, authenticated
USING (
  is_anonymous = true
  AND user_id IS NULL
  AND meta IS NULL
  AND created_at > (now() - interval '24 hours')
);

-- 2) Lock down realtime.messages: only allow subscription to the public activity topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_public_topic_read" ON realtime.messages;
CREATE POLICY "activity_public_topic_read"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (
  realtime.topic() IN (
    'realtime:public:activity_events',
    'realtime:activity-stream'
  )
);
