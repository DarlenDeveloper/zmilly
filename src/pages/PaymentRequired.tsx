import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  CreditCard, 
  CheckCircle2, 
  BadgeCheck,
  Zap,
  ArrowUpRight,
  Users,
  Mail,
  HeadphonesIcon,
  MessagesSquare,
  Settings2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { redirectToFlutterwavePayment } from "@/lib/flutterwave";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define plan prices
const PLANS = {
  starter: { price: 477000 }, // 477k UGX
  pro: { price: 677000 },     // 677k UGX
  enterprise: { price: 1500000 } // 1.5M UGX (though this will redirect to contact form)
};

const PaymentRequired = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  const handleSubscription = async (plan: 'starter' | 'pro' | 'enterprise') => {
    // For enterprise plan, redirect to contact form
    if (plan === 'enterprise') {
      navigate('/contact-sales');
      return;
    }
    
    try {
      setIsLoading({ ...isLoading, [plan]: true });
      setCheckoutError(null);
      
      const result = await redirectToFlutterwavePayment(plan, PLANS[plan].price);
      
      if (result?.error) {
        const errorMessage = result.error.message || 'Failed to initiate payment. Please try again.';
        setCheckoutError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error starting payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again later.';
      setCheckoutError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading({ ...isLoading, [plan]: false });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <header className="h-16 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-yellow-500" />
            <h1 className="text-xl font-semibold">Payment Required</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/subscription")}
            className="flex items-center gap-1.5 border-gray-300 hover:bg-gray-50 transition-colors"
            size="sm"
          >
            <CreditCard className="h-4 w-4 text-gray-600" />
            View Plans
          </Button>
        </header>
        
        <main className="flex-1 overflow-auto bg-white p-6">
          <div className="max-w-3xl mx-auto">
            {checkoutError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error starting payment</AlertTitle>
                <AlertDescription>{checkoutError}</AlertDescription>
              </Alert>
            )}
            
            <Card className="mb-8 shadow-lg border-0 overflow-hidden">
              <CardHeader className="text-center pb-2 bg-gradient-to-r from-gray-50 to-white">
                <div className="bg-yellow-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <ShieldAlert size={36} className="text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Subscription Required</h2>
                <p className="text-gray-600">You need an active subscription to access this feature</p>
              </CardHeader>
              <CardContent className="pt-4">
                <Separator className="mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Starter Plan */}
                  <Card className="border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 relative h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <h3 className="font-semibold text-lg">Starter</h3>
                      <div className="text-3xl font-bold mb-2">297,300<span className="text-sm font-normal text-gray-500"> UGX/month</span></div>
                      <p className="text-gray-600 text-sm">Perfect for small businesses</p>
                    </CardHeader>
                    <CardContent className="py-2 flex-grow">
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle2 size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Up to 20 concurrent calls</span>
                        </li>
                        <li className="flex items-start">
                          <BadgeCheck size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Access to analytics</span>
                        </li>
                        <li className="flex items-start">
                          <Mail size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Email support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        className="w-full bg-gray-800 hover:bg-black text-white"
                        onClick={() => handleSubscription('starter')}
                        disabled={isLoading.starter}
                      >
                        {isLoading.starter ? 'Processing...' : 'Subscribe Now'}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Pro Plan */}
                  <Card className="border-2 border-black rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 relative h-full flex flex-col transform hover:-translate-y-1">
                    <Badge className="absolute top-0 right-0 bg-black text-white rounded-md px-3 py-1 font-medium">
                      RECOMMENDED
                    </Badge>
                    <CardHeader className="pb-2">
                      <h3 className="font-semibold text-lg">Popular</h3>
                      <div className="text-3xl font-bold mb-2">597,300<span className="text-sm font-normal text-gray-500"> UGX/month</span></div>
                      <p className="text-gray-600 text-sm">For growing businesses</p>
                    </CardHeader>
                    <CardContent className="py-2 flex-grow">
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <Zap size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">All in starter</span>
                        </li>
                        <li className="flex items-start">
                          <ArrowUpRight size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Advanced analytics</span>
                        </li>
                        <li className="flex items-start">
                          <MessagesSquare size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Priority support</span>
                        </li>
                        <li className="flex items-start">
                          <Settings2 size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Custom AI training</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        className="w-full bg-black text-white hover:bg-gray-800"
                        onClick={() => handleSubscription('pro')}
                        disabled={isLoading.pro}
                      >
                        {isLoading.pro ? 'Processing...' : 'Subscribe Now'}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Enterprise Plan */}
                  <Card className="border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 relative h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <h3 className="font-semibold text-lg">Enterprise</h3>
                      <div className="text-3xl font-bold mb-2">Contact Sales</div>
                      <p className="text-gray-600 text-sm">For large organizations</p>
                    </CardHeader>
                    <CardContent className="py-2 flex-grow">
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle2 size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Everything in Pro</span>
                        </li>
                        <li className="flex items-start">
                          <Users size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Dedicated account manager</span>
                        </li>
                        <li className="flex items-start">
                          <BadgeCheck size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">SSO authentication</span>
                        </li>
                        <li className="flex items-start">
                          <HeadphonesIcon size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">Custom integrations</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-300 hover:bg-gray-50"
                        onClick={() => handleSubscription('enterprise')}
                        disabled={isLoading.enterprise}
                      >
                        {isLoading.enterprise ? 'Processing...' : 'Contact Sales'}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default PaymentRequired;
