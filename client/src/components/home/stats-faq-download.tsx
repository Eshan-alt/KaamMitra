import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, MapPinned, ShieldCheck, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export function StatsFaqDownload() {
  const stats = [
    { value: "5,000+", label: "Workers hired", detail: "Skilled people finding steady work" },
    { value: "3,200+", label: "Jobs posted", detail: "From trusted local employers" },
    { value: "18", label: "Cities covered", detail: "Growing across India" },
    { value: "4.8/5", label: "Community rating", detail: "Built on real completed work" },
  ];
  const faqs = [
    ["How does Kaam Mitra keep people safe?", "Profiles can be verified, conversations stay private, and job and application actions are checked on the server."],
    ["Is it free for workers?", "Workers can browse jobs, build a profile, and apply without a platform fee. Employers can post opportunities and connect directly."],
    ["How do I find work near me?", "Use the location search on the jobs section or the nearby jobs view in your dashboard, then choose a 5, 10, or 20 km radius."],
    ["Can I use Kaam Mitra on my phone?", "Yes. The responsive web experience works on any phone today, and a dedicated app is planned for a future release."],
  ];

  return (
    <>
      <section className="border-y bg-background py-14">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 md:grid-cols-4 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="text-center">
              <p className="text-3xl font-black tracking-tight text-gradient md:text-4xl">{stat.value}</p>
              <p className="mt-1 font-semibold">{stat.label}</p>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{stat.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="secondary" className="mb-3">Good to know</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Questions, answered.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">Everything you need to start finding reliable work or trusted local talent.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Trust-first community</span>
              <span className="inline-flex items-center gap-2"><MapPinned className="h-4 w-4 text-primary" /> Hyperlocal discovery</span>
            </div>
          </div>
          <Accordion type="single" collapsible className="rounded-2xl border bg-background px-5">
            {faqs.map(([question, answer], index) => (
              <AccordionItem value={`faq-${index}`} key={question}>
                <AccordionTrigger className="text-left">{question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-fuchsia-600 px-6 py-10 text-white shadow-xl md:px-12">
            <div className="relative z-10 max-w-2xl">
              <Badge className="border-white/20 bg-white/15 text-white">Coming soon</Badge>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">Your next opportunity, in your pocket.</h2>
              <p className="mt-3 text-white/80">The Kaam Mitra mobile app is on the way. Get the same trusted marketplace with faster alerts and easy document sharing.</p>
              <Button variant="secondary" className="mt-6" onClick={() => window.alert("We’ll let you know when the Kaam Mitra app is ready.")}>
                <Download className="mr-2 h-4 w-4" /> Notify me when it launches
              </Button>
            </div>
            <Smartphone className="absolute -bottom-12 right-10 hidden h-56 w-56 rotate-12 text-white/10 md:block" />
          </div>
        </div>
      </section>
    </>
  );
}