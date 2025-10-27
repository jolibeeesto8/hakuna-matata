import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChatConversation, ChatMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useChat = (conversationId?: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setLoading(false);
      return;
    }

    if (conversationId) {
      loadMessages(conversationId);
      subscribeToMessages(conversationId);
    } else {
      loadConversations();
    }

    return () => {
      if (conversationId) {
        supabase.removeChannel(supabase.channel(`chat:${conversationId}`));
      }
    };
  }, [user, conversationId]);

  const loadConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id},admin_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
    }

    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      markMessagesAsRead(convId);
    }

    setLoading(false);
  };

  const subscribeToMessages = (convId: string) => {
    const channel = supabase
      .channel(`chat:${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          if (payload.new.sender_id !== user?.id) {
            markMessagesAsRead(convId);
          }
        }
      )
      .subscribe();
  };

  const markMessagesAsRead = async (convId: string) => {
    if (!user) return;

    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', convId)
      .maybeSingle();

    if (!conversation) return;

    const updateField =
      conversation.buyer_id === user.id
        ? 'read_by_buyer'
        : conversation.seller_id === user.id
        ? 'read_by_seller'
        : conversation.admin_id === user.id
        ? 'read_by_admin'
        : null;

    if (updateField) {
      await supabase
        .from('chat_messages')
        .update({ [updateField]: true })
        .eq('conversation_id', convId)
        .eq(updateField, false);
    }
  };

  const sendMessage = async (convId: string, message: string, attachmentUrl?: string) => {
    if (!user) return;

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      message,
      attachment_url: attachmentUrl || null,
    });

    if (error) {
      throw error;
    }
  };

  const createConversation = async (
    buyerId: string,
    sellerId: string,
    transactionId?: string
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        transaction_id: transactionId || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  return {
    conversations,
    messages,
    loading,
    sendMessage,
    createConversation,
    refresh: conversationId ? () => loadMessages(conversationId) : loadConversations,
  };
};
