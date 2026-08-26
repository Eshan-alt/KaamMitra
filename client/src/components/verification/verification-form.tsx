import { useState, useRef } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, Loader2, Upload, Info, AlertCircle } from "lucide-react";
import { format, subYears } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const verificationSchema = z.object({
  govtIdType: z.enum(["aadhar_card", "voter_id", "passport", "driving_license", "pan_card"], {
    error: "ID type is required",
  }),
  govtId: z.string().min(1, "Government ID is required"),
  dateOfBirth: z.date({
    error: "Date of birth is required",
  }).refine(date => {
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return age >= 18;
  }, {
    message: "You must be at least 18 years old to register",
  }),
  address: z.string().min(1, "Address is required"),
  document: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "ID document photo is required",
  }),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

export function VerificationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      govtIdType: "aadhar_card",
      govtId: "",
      address: user?.location || "",
    },
  });

  // Handle file preview
  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFileName(file.name);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFileName(null);
      setPreviewUrl(null);
    }
  };

  const verificationMutation = useMutation({
    mutationFn: async (data: VerificationFormValues) => {
      const formData = new FormData();
      formData.append("userId", user?.id.toString() || "");
      formData.append("govtIdType", data.govtIdType);
      formData.append("govtId", data.govtId);
      formData.append("dateOfBirth", data.dateOfBirth.toISOString().slice(0, 10));
      formData.append("address", data.address);
      
      // Append the document file
      if (data.document[0]) {
        formData.append("document", data.document[0]);
      }
      
      const res = await apiRequest("POST", "/api/verification/submit", formData);
      return await res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Verification submitted",
        description: "Your verification details have been submitted for review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: VerificationFormValues) => {
    verificationMutation.mutate(data);
  };

  if (user?.verificationStatus === "verified") {
    return (
      <div className="p-8 text-center border rounded-lg border-border bg-muted/30">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">Verified Account</h3>
        <p className="mt-2 text-muted-foreground">
          Your account has been verified. You have full access to all features.
        </p>
      </div>
    );
  }

  if (user?.verificationStatus === "pending" || isSubmitted) {
    return (
      <div className="p-8 text-center border rounded-lg border-border bg-muted/30">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
        <h3 className="text-xl font-semibold">Verification In Progress</h3>
        <p className="mt-2 text-muted-foreground">
          Your verification is currently under review. This process may take 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-3 bg-muted/40">
        <CardTitle className="text-2xl">Identity Verification</CardTitle>
        <CardDescription>
          To ensure the safety and trust of our community, we require verification of your identity.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <Alert variant="default" className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
          <Info className="w-4 h-4 mr-2" />
          <AlertTitle>Required Information</AlertTitle>
          <AlertDescription>
            Please fill out all fields and upload a clear photo of your government ID.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="govtIdType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aadhar_card">Aadhar Card</SelectItem>
                        <SelectItem value="voter_id">Voter ID</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                        <SelectItem value="pan_card">PAN Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select your government ID type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="govtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your ID number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your ID number without spaces
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select your birth date</span>
                          )}
                          <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          const eighteenYearsAgo = new Date(today);
                          eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
                          // Also set a reasonable lower limit (100 years ago)
                          const hundredYearsAgo = new Date(today);
                          hundredYearsAgo.setFullYear(today.getFullYear() - 100);
                          return date > eighteenYearsAgo || date < hundredYearsAgo;
                        }}
                        defaultMonth={subYears(new Date(), 25)} // Default to showing 25 years ago
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    You must be at least 18 years old to register
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your complete address" {...field} />
                  </FormControl>
                  <FormDescription>
                    Include street, city, state and postal code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="document"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>ID Document Photo</FormLabel>
                  <FormControl>
                    <div className="grid gap-4">
                      <div
                        className={cn(
                          "relative flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg cursor-pointer hover:bg-muted/50",
                          previewUrl ? "border-primary/50 bg-muted/30" : "border-border"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const files = e.target.files;
                            onChange(files);
                            handleFileChange(files);
                          }}
                        />
                        {previewUrl ? (
                          <div className="w-full">
                            <img 
                              src={previewUrl} 
                              alt="ID Preview" 
                              className="object-cover w-full h-auto max-h-48 mx-auto rounded"
                            />
                            <p className="mt-2 text-sm text-muted-foreground">
                              {selectedFileName}
                            </p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 mb-2 text-muted-foreground" />
                            <p className="mb-1 text-sm font-medium">Upload ID image</p>
                            <p className="text-xs text-muted-foreground">
                              Drag and drop or click to browse
                            </p>
                          </>
                        )}
                      </div>
                      
                      {previewUrl && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (fileInputRef.current) fileInputRef.current.value = "";
                            onChange(null);
                            setSelectedFileName(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Change image
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a clear image of your government ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={verificationMutation.isPending}
            >
              {verificationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting verification...
                </>
              ) : (
                "Submit Verification"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}