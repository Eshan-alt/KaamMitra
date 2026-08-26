import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, MessageCircle, BriefcaseBusiness, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Notification = {
  id: number;
  title?: string | null;
  message: string;
  type?: string | null;
  readAt?: string | null;
  createdAt: string;
};

function iconFor(type?: string | null) {
  if (type?.includes("message")) return MessageCircle;
  if (type?.includes("job") || type?.includes("application")) return BriefcaseBusiness;
  if (type?.includes("verification")) return ShieldCheck;
  if (type?.includes("payment")) return WalletCards;
  return Bell;
}

export function NotificationsCenter() {
  const { data, isLoading } = useQuery<{ items: Notification[]; unread: number }>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30_000,
  });
  const notifications = data?.items ?? [];

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter((item) => !item.readAt).map((item) => apiRequest("PATCH", `/api/notifications/${item.id}/read`)),
    );
    await queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Open notifications">
          <Bell className="h-5 w-5" />
          {!!data?.unread && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
              {data.unread > 9 ? "9+" : data.unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">{data?.unread ?? 0} unread updates</p>
          </div>
          {!!data?.unread && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-1 h-4 w-4" /> Mark read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading updates…</p>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">You’re all caught up</p>
              <p className="mt-1 text-xs text-muted-foreground">New jobs, messages, and account updates will appear here.</p>
            </div>
          ) : (
            notifications.slice(0, 12).map((item) => {
              const Icon = iconFor(item.type);
              return (
                <div key={item.id} className={`flex gap-3 border-b px-4 py-3 last:border-0 ${!item.readAt ? "bg-primary/5" : ""}`}>
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.title || "Kaam Mitra update"}</p>
                      {!item.readAt && <Badge className="h-2 w-2 rounded-full p-0" aria-label="Unread" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}