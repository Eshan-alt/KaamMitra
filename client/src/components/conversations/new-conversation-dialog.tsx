import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { useMessaging } from '@/hooks/use-messaging';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NewConversationDialogProps {
  userType?: 'worker' | 'employer'; // Optional: filter by user type
  onConversationCreated?: (conversationId: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ 
  userType, 
  onConversationCreated, 
  open, 
  onOpenChange 
}: NewConversationDialogProps) {
  const { createConversation } = useMessaging();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedUserId(null);
      setSelectedJobId(null);
    }
  }, [open]);
  
  // Query to fetch users based on search term and filter by userType
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/search/users', searchTerm, userType],
    queryFn: async () => {
      // Only fetch if we have a search term
      if (!searchTerm.trim() || searchTerm.length < 2) return [];
      
      const params = new URLSearchParams({
        query: searchTerm,
        ...(userType ? { userType } : {}),
      });
      
      const res = await fetch(`/api/search/users?${params}`);
      if (!res.ok) throw new Error('Failed to search users');
      return res.json();
    },
    enabled: searchTerm.trim().length >= 2,
  });
  
  // Use the public active-job list for the optional related-job selector.
  // The old /api/my-jobs-and-applications endpoint was never registered.
  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
  });
  
  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a user to start a conversation with',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const result = await createConversation.mutateAsync({
        participantId: selectedUserId,
        jobId: selectedJobId,
      });
      
      toast({
        title: 'Success',
        description: 'Conversation started successfully',
      });
      
      onOpenChange(false);
      onConversationCreated?.(result.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format the user name for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a conversation with a {userType === 'worker' ? 'worker' : userType === 'employer' ? 'employer' : 'user'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">
              Search for a {userType === 'worker' ? 'worker' : userType === 'employer' ? 'employer' : 'user'}
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={`Search by name or location...`}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isLoadingUsers && searchTerm.trim().length >= 2 ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : searchTerm.trim().length >= 2 && users && users.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2 text-center">
                No users found matching "{searchTerm}"
              </p>
            ) : null}
            
            {users && users.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    className={`flex items-center space-x-3 p-2 cursor-pointer hover:bg-muted transition-colors ${
                      selectedUserId === user.id ? 'bg-muted/70' : ''
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user.fullName} />
                      <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedUserId && (
            <div className="space-y-2">
              <Label htmlFor="job">Related Job (Optional)</Label>
              <Select value={selectedJobId?.toString() || ''} onValueChange={(value) => setSelectedJobId(value ? parseInt(value) : null)}>
                <SelectTrigger id="job">
                  <SelectValue placeholder="Select a related job (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {jobs && jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!selectedUserId || isSubmitting} className="gap-1">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Start Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}