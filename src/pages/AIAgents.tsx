import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, Edit, Trash2, Mic } from "lucide-react";
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

// Zod schema for AI voice training data form
const aiVoiceTrainingSchema = z.object({
  training_text: z.string().min(10, { message: "Training text must be at least 10 characters." }),
  voice_gender: z.enum(["male", "female"], { 
    required_error: "Please select a voice gender." 
  }),
  notes: z.string().optional()
});

type AIVoiceTrainingFormData = z.infer<typeof aiVoiceTrainingSchema>;

// Define the interface for AI Training Data
interface AITrainingData {
  id: string;
  training_ref_id: string;
  training_text: string;
  voice_gender: "male" | "female";
  notes: string | null;
  created_at: string;
  user_id: string;
}

const AIAgents = () => {
  const { user } = useAuth();
  const [trainingData, setTrainingData] = useState<AITrainingData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTrainingDialogOpen, setIsAddTrainingDialogOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AIVoiceTrainingFormData>({
    resolver: zodResolver(aiVoiceTrainingSchema),
    defaultValues: {
      voice_gender: "male"
    }
  });

  // Fetch training data on component mount
  useEffect(() => {
    fetchTrainingData();
  }, [user]);

  // Fetch training data from Supabase
  const fetchTrainingData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_voice_training')
        .select('*')
        .eq('user_id', user.id) // Filter by authenticated user ID for privacy
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTrainingData(data || []);
    } catch (error: any) {
      toast.error(`Error fetching training data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission to add new training data
  const handleAddTrainingData: SubmitHandler<AIVoiceTrainingFormData> = async (formData) => {
    if (!user) return toast.error("User not found");
    setIsSubmitting(true);
    
    try {
      // 1. Get the next sequence number for training data
      const { data: sequenceData, error: sequenceError } = await supabase.rpc('get_next_ai_training_sequence');
      
      if (sequenceError) throw new Error(`Failed to get next training ID sequence: ${sequenceError.message}`);
      if (sequenceData === null) throw new Error('Could not determine next training ID sequence.');

      const nextSequence = sequenceData as number;
      
      // 2. Format the new training_ref_id (e.g., TRN0001)
      const trainingRefId = `TRN${String(nextSequence).padStart(4, '0')}`; // Format to 4 digits

      // 3. Insert the training data with the generated ID
      const { error: insertError } = await supabase
        .from('ai_voice_training')
        .insert({
          ...formData,
          training_ref_id: trainingRefId,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.message.includes('duplicate key value violates unique constraint')) {
          throw new Error(`Generated Training ID '${trainingRefId}' was already taken. Please try again.`);
        } else {
          throw insertError;
        }
      }
      
      toast.success(`Training data added successfully with ID ${trainingRefId}!`);
      reset();
      setIsAddTrainingDialogOpen(false);
      fetchTrainingData(); // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to add training data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete training data
  const handleDeleteTrainingData = async (trainingData: AITrainingData) => {
    if (!confirm(`Are you sure you want to delete training data ${trainingData.training_ref_id}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_voice_training')
        .delete()
        .eq('id', trainingData.id);

      if (error) throw error;
      
      toast.success(`Training data ${trainingData.training_ref_id} deleted successfully!`);
      fetchTrainingData(); // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete training data: ${error.message}`);
    }
  };

  // Stats counts
  const maleVoiceCount = trainingData.filter(data => data.voice_gender === 'male').length;
  const femaleVoiceCount = trainingData.filter(data => data.voice_gender === 'female').length;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <header className="h-16 shrink-0 bg-white flex items-center px-6 justify-between border-b border-gray-100 shadow-sm">
          <div className="flex items-center">
            <Mic className="mr-2 h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">AI Voice Training</h1>
          </div>
          {/* Add Training Data Button triggers Dialog */}
          <Dialog open={isAddTrainingDialogOpen} onOpenChange={setIsAddTrainingDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Training Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px]">
              <DialogHeader>
                <DialogTitle>Add Voice Training Data</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleAddTrainingData)}>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="training_text" className="text-lg font-semibold flex items-center">
                      <Mic className="mr-2 h-5 w-5 text-blue-600" /> Training Text
                    </Label>
                    <div className="relative">
                      <Textarea 
                        id="training_text" 
                        placeholder="Enter text for voice training..." 
                        {...register('training_text')} 
                        className="h-40 text-lg p-4 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
                      />
                      <div className="absolute right-3 bottom-3 text-sm text-gray-500 bg-white px-2 rounded-md border border-gray-200">
                        Min 10 chars
                      </div>
                    </div>
                    {errors.training_text && <p className="text-sm text-red-600 mt-1">{errors.training_text.message}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Voice Gender</Label>
                    <RadioGroup defaultValue="male" {...register('voice_gender')} className="flex space-x-6 mt-2">
                      <div className="flex-1 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-4 border-2 border-transparent data-[state=checked]:border-blue-500">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" className="text-blue-600" />
                          <Label htmlFor="male" className="cursor-pointer text-lg font-medium">Male</Label>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 ml-6">Male voice training data</p>
                      </div>
                      <div className="flex-1 bg-purple-50 hover:bg-purple-100 transition-colors rounded-lg p-4 border-2 border-transparent data-[state=checked]:border-purple-500">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" className="text-purple-600" />
                          <Label htmlFor="female" className="cursor-pointer text-lg font-medium">Female</Label>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 ml-6">Female voice training data</p>
                      </div>
                    </RadioGroup>
                    {errors.voice_gender && <p className="text-sm text-red-600 mt-1">{errors.voice_gender.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-lg font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Notes (Optional)
                    </Label>
                    <div className="relative">
                      <Textarea 
                        id="notes" 
                        placeholder="Any additional notes about this training data..." 
                        {...register('notes')} 
                        className="h-24 p-4 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
                      />
                      <div className="absolute right-3 bottom-3 text-sm text-gray-500 bg-white px-2 rounded-md border border-gray-200">
                        Optional
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mt-6 mb-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Training Data Information</h3>
                  <p className="text-xs text-gray-600">Your training data helps improve AI voice models. Each entry receives a unique ID for tracking purposes.</p>
                </div>
                
                <DialogFooter className="mt-4">
                  <Button variant="outline" type="button" onClick={() => setIsAddTrainingDialogOpen(false)} className="mr-2">
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
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Training Data
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
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Training Data</p>
                  <p className="text-3xl font-bold">{trainingData.length}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Mic className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Male Voice</p>
                  <p className="text-3xl font-bold">{maleVoiceCount}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Female Voice</p>
                  <p className="text-3xl font-bold">{femaleVoiceCount}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Voice Training Data</CardTitle>
              <CardDescription>Manage your AI voice training data for modal training.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loading size="lg" />
                </div>
              ) : trainingData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Mic className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-600">No training data found</p>
                  <p className="text-sm text-gray-500 mb-4">Add your first voice training data to get started</p>
                  <Button 
                    onClick={() => setIsAddTrainingDialogOpen(true)} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Training Data
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Training ID</TableHead>
                      <TableHead className="max-w-[300px]">Text</TableHead>
                      <TableHead>Voice Gender</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingData.map((data) => (
                      <TableRow key={data.id}>
                        <TableCell className="font-medium">{data.training_ref_id}</TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {data.training_text}
                        </TableCell>
                        <TableCell>
                          <Badge variant={data.voice_gender === 'male' ? 'default' : 'secondary'}>
                            {data.voice_gender === 'male' ? 'Male' : 'Female'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(data.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 h-7 w-7"
                            onClick={() => handleDeleteTrainingData(data)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default AIAgents;
