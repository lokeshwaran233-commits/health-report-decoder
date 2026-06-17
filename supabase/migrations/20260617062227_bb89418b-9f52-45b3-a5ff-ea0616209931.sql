DROP POLICY IF EXISTS "activity_public_topic_read" ON realtime.messages;
CREATE POLICY "activity_authenticated_topic_read" ON realtime.messages
  FOR SELECT TO authenticated
  USING (realtime.topic() = ANY (ARRAY['realtime:public:activity_events'::text, 'realtime:activity-stream'::text]));