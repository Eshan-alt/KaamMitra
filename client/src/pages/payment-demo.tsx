import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpiPayment } from "@/components/ui/upi-payment";

export default function PaymentDemo() {
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  
  const handlePaymentSuccess = () => {
    setShowUpiPayment(false);
  };
  
  const handlePaymentCancel = () => {
    setShowUpiPayment(false);
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Payment Options</h1>
      
      <Tabs defaultValue="upi" className="w-full max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upi">UPI Payment</TabsTrigger>
          <TabsTrigger value="other">Other Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upi" className="space-y-4 mt-4">
          {showUpiPayment ? (
            <UpiPayment 
              amount={250} 
              description="Premium Membership"
              recipientId="kaammitra@ybl"
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>UPI Payment Demo</CardTitle>
                <CardDescription>
                  Easily make payments using UPI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    The UPI (Unified Payments Interface) allows you to instantly transfer money between bank accounts
                    using a mobile device. It's a secure and convenient way to pay for services on Kaam Mitra.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Premium Membership Benefits:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Priority matching with employers</li>
                      <li>Featured profile listing</li>
                      <li>Verification badge</li>
                      <li>Unlimited job applications</li>
                    </ul>
                    <p className="mt-3 font-medium">Price: ₹250</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setShowUpiPayment(true)} className="w-full">
                  Proceed to Pay
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="other" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Payment Methods</CardTitle>
              <CardDescription>
                Additional payment options coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  We're working on adding more payment methods to make it even easier for you
                  to use our services. Currently, UPI is the primary payment method supported.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Coming Soon:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Credit/Debit Card Payments</li>
                    <li>Net Banking</li>
                    <li>Mobile Wallets</li>
                    <li>International Payment Options</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}