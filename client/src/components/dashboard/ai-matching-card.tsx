import { useMutation } from "@tanstack/react-query";
import { Bot, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Recommendation = { title?: string; reason?: string; matchScore?: number };

export function AiMatchingCard({ primarySkill, location }: { primarySkill: string; location: string }) {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chatbot/job-recommendations", { primarySkill, location, preferredJobTypes: [] });
      return response.json() as Promise<{ recommendations?: Recommendation[] }>;
    },
    onError: (error: Error) => toast({ title: "AI matching unavailable", description: error.message, variant: "destructive" }),
  });
  const recommendations = mutation.data?.recommendations ?? [];
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-fuchsia-500/10">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-2xl" />
      <CardHeader><CardTitle className="flex items-center gap-2"><span className="rounded-lg bg-primary p-2 text-primary-foreground"><Bot className="h-4 w-4" /></span> AI job matching <Badge className="ml-auto bg-fuchsia-500"><Sparkles className="mr-1 h-3 w-3" />Beta</Badge></CardTitle><p className="text-sm text-muted-foreground">Get recommendations based on your skill and location, privately and securely.</p></CardHeader>
      <CardContent>
        {recommendations.length ? <div className="space-y-2">{recommendations.slice(0, 3).map((item, index) => <div key={`${item.title}-${index}`} className="rounded-xl border bg-background/80 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{item.title || "Recommended opportunity"}</p>{item.matchScore && <Badge variant="secondary">{item.matchScore}% match</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{item.reason || "A strong fit for your profile."}</p></div>)}</div> : <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full sm:w-auto">{mutation.isPending ? "Finding your best matches…" : <><WandSparkles className="mr-2 h-4 w-4" /> Find my best matches</>}</Button>}
      </CardContent>
    </Card>
  );
}