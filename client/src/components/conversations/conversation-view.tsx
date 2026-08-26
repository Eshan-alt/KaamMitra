import { useRef, useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, Circle, Send, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface ConversationViewProps {
  conversationId: number;
  onBack: () => void;
}

export function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const { user } = useAuth();
  const { getConversation, sendMessage, markMessageAsRead } = useMessaging();
  const { data: conversationDetails, isLoading } = getConversation(conversationId);

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  interface MessageType {
    id: number;
    content: string;
    senderId: number;
    sentAt: string;
    readAt: string | null;
  }

  // Function to format messages by date
  const groupMessagesByDate = (messages: MessageType[] = []) => {
    const groups: Record<string, MessageType[]> = {};
    
    messages.forEach(message => {
      const date = new Date(message.sentAt);
      let dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  };

  // Get grouped messages
  const messageGroups = conversationDetails?.messages ? groupMessagesByDate(conversationDetails.messages) : [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationDetails?.messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    const unreadMessages = conversationDetails?.messages?.filter(
      (message: { senderId: number; readAt: string | null; id: number }) => 
        message.senderId !== user?.id && !message.readAt
    );
    
    if (unreadMessages && unreadMessages.length > 0) {
      unreadMessages.forEach((message: { id: number }) => {
        markMessageAsRead.mutate({ messageId: message.id });
      });
    }
  }, [conversationDetails?.messages, user?.id, markMessageAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !conversationId || !user) return;
    
    try {
      setIsSending(true);
      await sendMessage.mutateAsync({
        conversationId,
        content: messageText.trim(),
      });
      
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <Skeleton className={`h-20 w-2/3 rounded-xl`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversationDetails?.conversation || !conversationDetails?.otherParticipant) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Conversation not found</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to conversations
        </Button>
      </div>
    );
  }

  const { conversation, otherParticipant, messages } = conversationDetails;

  // Format date label for message groups
  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  // Get initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="flex flex-col h-[70vh] border-0 shadow-none">
      <CardHeader className="border-b py-4 px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt={otherParticipant.fullName} />
            <AvatarFallback>{getInitials(otherParticipant.fullName)}</AvatarFallback>
          </Avatar>
           <div className="flex flex-col">
            <CardTitle className="text-base font-semibold">{otherParticipant.fullName}</CardTitle>
             <div className="mt-1 flex items-center gap-2">
               <span className="flex items-center gap-1 text-xs text-emerald-600"><Circle className="h-2 w-2 fill-current" /> Active recently</span>
              <Badge variant={otherParticipant.userType === 'worker' ? 'secondary' : 'outline'} className="text-xs">
                {otherParticipant.userType === 'worker' ? 'Worker' : 'Employer'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-y-auto p-4 space-y-6">
        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messageGroups.map(group => (
              <div key={group.date} className="space-y-3">
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground">
                      {formatDateLabel(group.date)}
                    </span>
                  </div>
                </div>

                {group.messages.map(message => (
                  <Message
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === user?.id}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <CardFooter className="border-t p-3 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
           <Input
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-grow"
            disabled={isSending}
          />
           <span className="hidden items-center self-center text-[11px] text-muted-foreground sm:flex" aria-live="polite">
             {isSending ? "Sending…" : "Private chat"}
           </span>
          <Button type="submit" disabled={!messageText.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

interface MessageProps {
  message: {
    id: number;
    content: string;
    senderId: number;
    sentAt: string;
    readAt: string | null;
  };
  isCurrentUser: boolean;
}

function Message({ message, isCurrentUser }: MessageProps) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isCurrentUser
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-muted rounded-tl-none'
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <div className={`text-xs mt-1 flex items-center gap-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {format(new Date(message.sentAt), 'h:mm a')}
          {isCurrentUser && (
            <span>{message.readAt ? '• Read' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}