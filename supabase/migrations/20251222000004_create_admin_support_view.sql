-- View: admin_support_inbox
-- Gets the most recent message for each user to sort the sidebar
CREATE OR REPLACE VIEW admin_support_inbox AS
SELECT DISTINCT ON (user_id)
    user_id,
    content AS last_message,
    sender_role,
    created_at AS last_activity,
    (SELECT email FROM auth.users WHERE id = m.user_id) AS user_email
FROM support_messages m
ORDER BY user_id, created_at DESC;
