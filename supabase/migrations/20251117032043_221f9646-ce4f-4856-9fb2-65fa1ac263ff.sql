-- Create messages table for direct messaging between mutual followers
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.runners(id) ON DELETE CASCADE,
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.runners(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  (SELECT runners.user_id FROM runners WHERE runners.id = messages.sender_id) = auth.uid()
  OR
  (SELECT runners.user_id FROM runners WHERE runners.id = messages.receiver_id) = auth.uid()
);

-- Policy: Users can send messages only to mutual followers
CREATE POLICY "Users can send messages to mutual followers"
ON public.messages
FOR INSERT
WITH CHECK (
  -- Sender must be authenticated user
  (SELECT runners.user_id FROM runners WHERE runners.id = messages.sender_id) = auth.uid()
  AND
  -- Both users must follow each other (mutual followers)
  EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = messages.sender_id AND following_id = messages.receiver_id
  )
  AND
  EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = messages.receiver_id AND following_id = messages.sender_id
  )
);

-- Policy: Users can update their own received messages (mark as read)
CREATE POLICY "Users can mark received messages as read"
ON public.messages
FOR UPDATE
USING (
  (SELECT runners.user_id FROM runners WHERE runners.id = messages.receiver_id) = auth.uid()
)
WITH CHECK (
  (SELECT runners.user_id FROM runners WHERE runners.id = messages.receiver_id) = auth.uid()
);

-- Policy: Users can delete their own sent or received messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (
  (SELECT runners.user_id FROM runners WHERE runners.id = messages.sender_id) = auth.uid()
  OR
  (SELECT runners.user_id FROM runners WHERE runners.id = messages.receiver_id) = auth.uid()
);

-- Create index for faster message queries
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();