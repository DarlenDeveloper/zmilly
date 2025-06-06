import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, Edit, Trash2, Mic, Settings, Bot } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Zod schema for model training form
const modelTrainingSchema = z.object({
  model_name: z.string().min(3, { message: "Model name must be at least 3 characters." }),
  provider: z.string().min(1, { message: "Provider is required." }),
  model_type: z.string().min(1, { message: "Model type is required." }),
  system_prompt: z.string().min(10, { message: "System prompt must be at least 10 characters." }),
  first_message: z.string().min(5, { message: "First message must be at least 5 characters." }),
  temperature: z.number().min(0).max(1),
  max_tokens: z.number().min(100).max(10000),
  files: z.array(z.string()).optional()
});

type ModelTrainingFormData = z.infer<typeof modelTrainingSchema>;

// Define the interface for Model Training Data
interface ModelTrainingData {
  id: string;
  model_ref_id: string;
  model_name: string;
  provider: string;
  model_type: string;
  system_prompt: string;
  first_message: string;
  temperature: number;
  max_tokens: number;
  files: string[] | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const ModalTraining = () => {
  const { user } = useAuth();
  const [modelData, setModelData] = useState<ModelTrainingData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ModelTrainingFormData>({
    resolver: zodResolver(modelTrainingSchema),
    defaultValues: {
      provider: "openai",
      model_type: "gpt-4.1-nano",
      temperature: 0.1,
      max_tokens: 2500,
      files: []
    }
  });

  // Watch temperature value for the slider
  const temperatureValue = watch("temperature");
  const maxTokensValue = watch("max_tokens");

  // Fetch model data on component mount
  useEffect(() => {
    fetchModelData();
  }, [user]);

  // Fetch model data from Supabase
  const fetchModelData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('model_training')
        .select('*')
        .eq('user_id', user.id) // Filter by authenticated user ID for privacy
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setModelData(data || []);
    } catch (error: any) {
      toast.error(`Error fetching model data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission to add new model data
  const handleAddModelData: SubmitHandler<ModelTrainingFormData> = async (formData) => {
    if (!user) return toast.error("User not found");
    setIsSubmitting(true);
    
    try {
      // 1. Get the next sequence number for model data
      const { data: sequenceData, error: sequenceError } = await supabase.rpc('get_next_model_training_sequence');
      
      if (sequenceError) throw new Error(`Failed to get next model ID sequence: ${sequenceError.message}`);
      if (sequenceData === null) throw new Error('Could not determine next model ID sequence.');

      const nextSequence = sequenceData as number;
      
      // 2. Format the new model_ref_id (e.g., MDL0001)
      const modelRefId = `MDL${String(nextSequence).padStart(4, '0')}`; // Format to 4 digits

      // 3. Insert the model data with the generated ID
      const { error: insertError } = await supabase
        .from('model_training')
        .insert({
          ...formData,
          model_ref_id: modelRefId,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.message.includes('duplicate key value violates unique constraint')) {
          throw new Error(`Generated Model ID '${modelRefId}' was already taken. Please try again.`);
        } else {
          throw insertError;
        }
      }
      
      toast.success(`Model data added successfully with ID ${modelRefId}!`);
      reset();
      setIsAddModelDialogOpen(false);
      fetchModelData(); // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to add model data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete model data
  const handleDeleteModelData = async (modelData: ModelTrainingData) => {
    if (!confirm(`Are you sure you want to delete model ${modelData.model_ref_id}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('model_training')
        .delete()
        .eq('id', modelData.id);

      if (error) throw error;
      
      toast.success(`Model ${modelData.model_ref_id} deleted successfully!`);
      fetchModelData(); // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete model: ${error.message}`);
    }
  };

  // Stats counts
  const openaiCount = modelData.filter(data => data.provider === 'openai').length;
  const otherProvidersCount = modelData.length - openaiCount;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <header className="h-16 shrink-0 bg-white flex items-center px-6 justify-between border-b border-gray-100 shadow-sm">
          <div className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Modal Training</h1>
          </div>
          {/* Add Model Data Button triggers Dialog */}
          <Dialog open={isAddModelDialogOpen} onOpenChange={setIsAddModelDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px]">
              <DialogHeader>
                <DialogTitle>Configure Model</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleAddModelData)}>
                <div className="py-4">
                  {/* Two-column layout for form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Left Column */}
                      {/* Model Name */}
                      <div className="space-y-2">
                        <Label htmlFor="model_name" className="text-lg font-semibold flex items-center">
                          <Bot className="mr-2 h-5 w-5 text-blue-600" /> Model Name
                        </Label>
                        <Input 
                          id="model_name" 
                          placeholder="Enter model name..." 
                          {...register('model_name')} 
                          className="text-lg p-3 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
                        />
                        {errors.model_name && <p className="text-sm text-red-600 mt-1">{errors.model_name.message}</p>}
                      </div>
                      
                      {/* Provider */}
                      <div className="space-y-2">
                        <Label htmlFor="provider" className="text-lg font-semibold">Provider</Label>
                        <Select 
                          defaultValue="openai" 
                          onValueChange={(value) => setValue('provider', value)}
                        >
                          <SelectTrigger className="text-lg p-3 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="mistral">Mistral</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.provider && <p className="text-sm text-red-600 mt-1">{errors.provider.message}</p>}
                      </div>
                      
                      {/* Model Type */}
                      <div className="space-y-2">
                        <Label htmlFor="model_type" className="text-lg font-semibold">Model</Label>
                        <Select 
                          defaultValue="gpt-4.1-nano" 
                          onValueChange={(value) => setValue('model_type', value)}
                        >
                          <SelectTrigger className="text-lg p-3 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4.1-nano">gpt-4.1-nano</SelectItem>
                            <SelectItem value="gpt-4">gpt-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.model_type && <p className="text-sm text-red-600 mt-1">{errors.model_type.message}</p>}
                      </div>

                      {/* First Message */}
                      <div className="space-y-2">
                        <Label htmlFor="first_message" className="text-lg font-semibold flex items-center">
                          <Mic className="mr-2 h-5 w-5 text-blue-600" /> First Message
                        </Label>
                        <div className="relative">
                          <Input 
                            id="first_message" 
                            placeholder="Hi there, this is Airies Customer care support from Serena Hotel..." 
                            {...register('first_message')} 
                            className="text-lg p-3 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
                          />
                          <div className="absolute right-3 bottom-3 text-sm text-gray-500 bg-white px-2 rounded-md border border-gray-200">
                            Min 5 chars
                          </div>
                        </div>
                        {errors.first_message && <p className="text-sm text-red-600 mt-1">{errors.first_message.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Right Column */}
                      {/* System Prompt */}
                      <div className="space-y-2">
                        <Label htmlFor="system_prompt" className="text-lg font-semibold flex items-center">
                          <Settings className="mr-2 h-5 w-5 text-blue-600" /> System Prompt
                        </Label>
                        <div className="relative">
                          <Textarea 
                            id="system_prompt" 
                            placeholder="[Identity]\nYou are Airies, an African customer service voice assistant for Serena Hotel..." 
                            {...register('system_prompt')} 
                            className="h-[220px] text-lg p-3 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
                          />
                          <div className="absolute right-3 bottom-3 text-sm text-gray-500 bg-white px-2 rounded-md border border-gray-200">
                            Min 10 chars
                          </div>
                        </div>
                        {errors.system_prompt && <p className="text-sm text-red-600 mt-1">{errors.system_prompt.message}</p>}
                      </div>
                      
                      {/* Temperature and Max Tokens in a row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* Temperature */}
                        <div className="space-y-2">
                          <Label htmlFor="temperature" className="text-lg font-semibold flex items-center justify-between">
                            <span>Temperature</span>
                            <span className="text-blue-600 font-mono">{temperatureValue}</span>
                          </Label>
                          <Slider
                            id="temperature"
                            min={0}
                            max={1}
                            step={0.1}
                            value={[temperatureValue]}
                            onValueChange={(value) => setValue('temperature', value[0])}
                            className="py-4"
                          />
                        </div>
                        
                        {/* Max Tokens */}
                        <div className="space-y-2">
                          <Label htmlFor="max_tokens" className="text-lg font-semibold flex items-center justify-between">
                            <span>Max Tokens</span>
                            <span className="text-blue-600 font-mono">{maxTokensValue}</span>
                          </Label>
                          <Input 
                            id="max_tokens" 
                            type="number"
                            min={100}
                            max={10000}
                            {...register('max_tokens', { valueAsNumber: true })} 
                            className="text-lg p-3 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
                          />
                          {errors.max_tokens && <p className="text-sm text-red-600 mt-1">{errors.max_tokens.message}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mt-6 mb-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Model Configuration Information</h3>
                  <p className="text-xs text-gray-600">Your model configuration helps customize AI behavior. Each model receives a unique ID for tracking purposes.</p>
                </div>
                
                <DialogFooter className="mt-4">
                  <Button variant="outline" type="button" onClick={() => setIsAddModelDialogOpen(false)} className="mr-2">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Model
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 overflow-auto bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Models</p>
                  <p className="text-3xl font-bold">{modelData.length}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Bot className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">OpenAI Models</p>
                  <p className="text-3xl font-bold">{openaiCount}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Other Providers</p>
                  <p className="text-3xl font-bold">{otherProvidersCount}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Model Configurations</CardTitle>
              <CardDescription>Manage your AI model configurations for training and deployment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loading size="lg" />
                  </div>
                ) : modelData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Bot className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-600">No model configurations found</p>
                    <p className="text-sm text-gray-500 mb-4">Add your first model configuration to get started</p>
                    <Button 
                      onClick={() => setIsAddModelDialogOpen(true)} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Model
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-500">Showing {modelData.length} model configurations</h3>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => window.print()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => {
                            // Export data as CSV
                            const headers = ['Model ID', 'Name', 'Provider', 'Model Type', 'Temperature', 'Max Tokens', 'Created At'];
                            const csvData = modelData.map(data => [
                              data.model_ref_id,
                              data.model_name,
                              data.provider,
                              data.model_type,
                              data.temperature,
                              data.max_tokens,
                              new Date(data.created_at).toLocaleString()
                            ]);
                            
                            const csvContent = [
                              headers.join(','),
                              ...csvData.map(row => row.join(','))
                            ].join('\n');
                            
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.setAttribute('href', url);
                            link.setAttribute('download', 'model_configurations.csv');
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export CSV
                        </Button>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="w-[120px] py-3">Model ID</TableHead>
                            <TableHead className="py-3">Name</TableHead>
                            <TableHead className="py-3">Provider</TableHead>
                            <TableHead className="py-3">Model Type</TableHead>
                            <TableHead className="py-3">Temperature</TableHead>
                            <TableHead className="py-3">Max Tokens</TableHead>
                            <TableHead className="py-3">Created At</TableHead>
                            <TableHead className="text-right py-3">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TooltipProvider>
                          <TableBody>
                            {modelData.map((data) => (
                              <TableRow key={data.id} className="hover:bg-gray-50">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TableCell className="font-mono text-sm font-medium cursor-help border-r">
                                      <code className="px-1.5 py-0.5 bg-gray-100 rounded">{data.model_ref_id}</code>
                                    </TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent className="w-80 bg-white shadow-lg border border-gray-200 rounded-lg p-4">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-gray-900 border-b pb-1 mb-2">Model Details</h4>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-gray-600">ID:</div>
                                        <div className="font-medium text-gray-900">{data.model_ref_id}</div>
                                        
                                        <div className="text-gray-600">Name:</div>
                                        <div className="font-medium text-gray-900">{data.model_name}</div>
                                        
                                        <div className="text-gray-600">Created:</div>
                                        <div className="text-gray-700">{new Date(data.created_at).toLocaleString()}</div>
                                        
                                        <div className="text-gray-600">Updated:</div>
                                        <div className="text-gray-700">{new Date(data.updated_at).toLocaleString()}</div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TableCell className="font-medium border-r">
                                      <div className="line-clamp-1 hover:text-blue-600 transition-colors">
                                        {data.model_name}
                                      </div>
                                    </TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs bg-white shadow-lg border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-900 mb-2">Model Name</h4>
                                    <p className="text-sm text-gray-700">{data.model_name}</p>
                                    {data.files && data.files.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Training Files:</p>
                                        <div className="space-y-1">
                                          {data.files.slice(0, 3).map((file, i) => (
                                            <div key={i} className="text-xs text-gray-600 truncate">
                                              • {file}
                                            </div>
                                          ))}
                                          {data.files.length > 3 && (
                                            <div className="text-xs text-gray-500">+{data.files.length - 3} more files</div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TableCell className="border-r">
                                      <Badge variant={data.provider === 'openai' ? 'default' : 'secondary'} className="capitalize">
                                        {data.provider}
                                      </Badge>
                                    </TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white shadow-lg border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-900 mb-1">AI Provider</h4>
                                    <p className="text-sm text-gray-700">
                                      {data.provider === 'openai' ? 'OpenAI' : 
                                       data.provider === 'anthropic' ? 'Anthropic' : 
                                       data.provider === 'google' ? 'Google' : 
                                       data.provider === 'mistral' ? 'Mistral' : data.provider}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {data.provider === 'openai' ? 'Advanced AI models by OpenAI' :
                                       data.provider === 'anthropic' ? 'AI safety research company' :
                                       data.provider === 'google' ? 'Google Cloud AI services' :
                                       data.provider === 'mistral' ? 'Open-weight AI models' : 'AI model provider'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TableCell className="border-r">
                                      <code className="text-sm bg-gray-50 px-1.5 py-0.5 rounded">
                                        {data.model_type}
                                      </code>
                                    </TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white shadow-lg border border-gray-200 rounded-lg p-3 max-w-xs">
                                    <h4 className="font-semibold text-gray-900 mb-1">Model Type</h4>
                                    <p className="text-sm text-gray-700">{data.model_type}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {data.model_type.includes('gpt-4') ? 'Most capable model, great for complex tasks' :
                                       data.model_type.includes('gpt-3.5') ? 'Faster and lower cost, good for most tasks' :
                                       'Custom model configuration'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TableCell className="border-r">
                                      <div className="flex items-center">
                                        <div className="w-10 h-2 bg-gray-200 rounded-full mr-2">
                                          <div 
                                            className={`h-full rounded-full ${data.temperature <= 0.3 ? 'bg-blue-500' : data.temperature <= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${data.temperature * 100}%` }}
                                          ></div>
                                        </div>
                                        <span>{data.temperature}</span>
                                      </div>
                                    </TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Temperature: {data.temperature}</p>
                                    <p className="text-xs text-gray-500">Controls randomness (0-1)</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TableCell className="border-r">{data.max_tokens}</TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Max Tokens: {data.max_tokens}</p>
                                    <p className="text-xs text-gray-500">Maximum response length</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TableCell className="whitespace-nowrap border-r text-sm text-gray-600">
                                      {new Date(data.created_at).toLocaleDateString()}
                                    </TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white shadow-lg border border-gray-200 rounded-lg p-3">
                                    <div className="space-y-2">
                                      <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">Created</h4>
                                        <p className="text-sm text-gray-700">
                                          {new Date(data.created_at).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="pt-2 border-t border-gray-100">
                                        <h4 className="font-semibold text-gray-900 text-sm">Last Updated</h4>
                                        <p className="text-sm text-gray-700">
                                          {new Date(data.updated_at).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-blue-600 h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // View system prompt in a dialog
                                            const toastId = `model-config-${data.id}`;
                                            
                                            toast.custom((id: string | number) => (
                                              <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl">
                                                <div className="absolute top-2 right-2">
                                                  <button
                                                    onClick={() => toast.dismiss(id)}
                                                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                                    aria-label="Close"
                                                  >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                  </button>
                                                </div>
                                                <div className="p-4 pt-8">
                                                  <div className="flex items-center mb-4">
                                                    <Settings className="h-5 w-5 text-blue-600 mr-2" />
                                                    <h4 className="text-lg font-semibold">Model Configuration: {data.model_name}</h4>
                                                  </div>
                                                  <div className="space-y-4">
                                                    <div>
                                                      <h5 className="font-medium text-sm text-gray-700 mb-1">System Prompt:</h5>
                                                      <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
                                                        <pre className="whitespace-pre-wrap font-sans text-sm">{data.system_prompt}</pre>
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <h5 className="font-medium text-sm text-gray-700 mb-1">First Message:</h5>
                                                      <div className="bg-gray-50 p-3 rounded-md">
                                                        <p className="text-sm">{data.first_message}</p>
                                                      </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                      <div>
                                                        <span className="text-gray-500">Model Type:</span>{' '}
                                                        <span className="font-medium">{data.model_type}</span>
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">Temperature:</span>{' '}
                                                        <span className="font-medium">{data.temperature}</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="bg-gray-50 px-4 py-3 rounded-b-lg flex justify-end space-x-2">
                                                  <button
                                                    onClick={() => toast.dismiss(id)}
                                                    className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                                                  >
                                                    Close
                                                  </button>
                                                </div>
                                              </div>
                                            ), {
                                              duration: 30000,
                                              id: toastId
                                            });
                                          }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-center">
                                          <p className="font-medium">View Configuration</p>
                                          <p className="text-xs text-gray-500">System prompt and settings</p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-600 h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteModelData(data);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-center">
                                          <p className="font-medium">Delete Model</p>
                                          <p className="text-xs text-gray-500">This action cannot be undone</p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </TooltipProvider>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ModalTraining;
