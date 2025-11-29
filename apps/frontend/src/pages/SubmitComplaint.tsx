import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ticketApi, organizationApi, aiApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Upload,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Wand2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.enum(['TRANSPORT', 'HOSTEL', 'ACADEMIC', 'ADMINISTRATIVE', 'OTHER']),
  type: z.enum(['COMPLAINT', 'SUGGESTION']),
  collegeId: z.string().optional(),
  departmentId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface College {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AiClassification {
  category: string;
  confidence: number;
  suggestedRoutingLevel: string;
}

interface AiPriority {
  priority: string;
  confidence: number;
  slaHours: number;
}

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [aiClassification, setAiClassification] = useState<AiClassification | null>(null);
  const [aiPriority, setAiPriority] = useState<AiPriority | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<{
    enhancedTitle: string;
    enhancedText: string;
    improvements: string[];
    suggestions: string[];
  } | null>(null);
  const [showEnhancePreview, setShowEnhancePreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'COMPLAINT',
      isAnonymous: false,
    },
  });

  const selectedCollegeId = watch('collegeId');
  const description = watch('description');
  const title = watch('title');

  useEffect(() => {
    organizationApi.getColleges().then((res) => {
      setColleges(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (selectedCollegeId) {
      organizationApi.getDepartments(selectedCollegeId).then((res) => {
        setDepartments(res.data.data || []);
      });
    } else {
      setDepartments([]);
    }
  }, [selectedCollegeId]);

  // AI Analysis when description changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (description && description.length >= 20) {
        setIsAnalyzing(true);
        try {
          const [classifyRes, priorityRes] = await Promise.all([
            aiApi.classify(description, title),
            aiApi.predictPriority(description, title),
          ]);
          setAiClassification(classifyRes.data.data);
          setAiPriority(priorityRes.data.data);
          
          // Auto-set category if confidence is high
          if (classifyRes.data.data.confidence > 0.7) {
            setValue('category', classifyRes.data.data.category);
          }
        } catch {
          // Silently fail AI analysis
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description, title, setValue]);

  const handleEnhance = async () => {
    const currentTitle = watch('title');
    const currentDescription = watch('description');
    const currentType = watch('type');

    if (!currentDescription || currentDescription.length < 20) {
      toast({
        title: 'Not enough content',
        description: 'Please write at least 20 characters to enhance.',
        variant: 'destructive',
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await aiApi.enhanceText(
        currentDescription,
        currentTitle,
        currentType.toLowerCase() as 'complaint' | 'suggestion'
      );
      setEnhancedResult(response.data.data);
      setShowEnhancePreview(true);
    } catch (error) {
      toast({
        title: 'Enhancement failed',
        description: 'Could not enhance text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyEnhancement = () => {
    if (enhancedResult) {
      if (enhancedResult.enhancedTitle) {
        setValue('title', enhancedResult.enhancedTitle);
      }
      setValue('description', enhancedResult.enhancedText);
      setShowEnhancePreview(false);
      setEnhancedResult(null);
      toast({
        title: 'Enhancement applied!',
        description: 'Your text has been improved.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await ticketApi.create(data);
      const ticket = response.data.data;

      toast({
        title: 'Ticket Submitted!',
        description: `Your ticket number is ${ticket.ticketNumber}. You can track it using this number.`,
      });

      navigate(`/track?number=${ticket.ticketNumber}`);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.response?.data?.error?.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'TRANSPORT', label: 'Transport', description: 'Bus routes, timing, drivers' },
    { value: 'HOSTEL', label: 'Hostel', description: 'Rooms, food, facilities' },
    { value: 'ACADEMIC', label: 'Academic', description: 'Classes, faculty, exams' },
    { value: 'ADMINISTRATIVE', label: 'Administrative', description: 'Fees, documents, office' },
    { value: 'OTHER', label: 'Other', description: 'Any other issues' },
  ];

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Submit a Complaint or Suggestion</h1>
        <p className="text-muted-foreground mt-2">
          Fill out the form below to submit your feedback. We'll route it to the appropriate authority.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>What would you like to submit?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {['COMPLAINT', 'SUGGESTION'].map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all',
                    watch('type') === type
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('type')}
                    className="sr-only"
                  />
                  <span className="text-lg font-semibold">
                    {type === 'COMPLAINT' ? '📋 Complaint' : '💡 Suggestion'}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {type === 'COMPLAINT' ? 'Report an issue' : 'Share an idea'}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Category</CardTitle>
            <CardDescription>
              Choose the category that best describes your {watch('type').toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className={cn(
                    'flex flex-col p-4 rounded-lg border cursor-pointer transition-all text-center',
                    watch('category') === cat.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  )}
                >
                  <input
                    type="radio"
                    value={cat.value}
                    {...register('category')}
                    className="sr-only"
                  />
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{cat.description}</span>
                </label>
              ))}
            </div>
            {errors.category && (
              <p className="text-sm text-red-500 mt-2">{errors.category.message}</p>
            )}
          </CardContent>
        </Card>

        {/* College & Department */}
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>Select your college and department (if applicable)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">College</label>
              <select
                {...register('collegeId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="">Select college...</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <select
                {...register('departmentId')}
                disabled={!selectedCollegeId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 disabled:opacity-50"
              >
                <option value="">Select department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Title & Description */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Details</CardTitle>
                <CardDescription>Provide a clear title and detailed description</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhance}
                disabled={isEnhancing || !description || description.length < 20}
                className="gap-2"
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                AI Enhance
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                {...register('title')}
                placeholder="Brief summary of your complaint/suggestion"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                {...register('description')}
                placeholder="Provide detailed information about your complaint or suggestion. Include relevant dates, locations, and any other details that might help us understand the issue better."
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 resize-none"
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* AI Enhancement Preview */}
            {showEnhancePreview && enhancedResult && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                      AI Enhanced Version
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEnhancePreview(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {enhancedResult.enhancedTitle && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Enhanced Title:</span>
                    <p className="text-sm font-medium mt-1 p-2 bg-white/50 dark:bg-black/20 rounded">
                      {enhancedResult.enhancedTitle}
                    </p>
                  </div>
                )}

                <div className="mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Enhanced Description:</span>
                  <p className="text-sm mt-1 p-2 bg-white/50 dark:bg-black/20 rounded whitespace-pre-wrap">
                    {enhancedResult.enhancedText}
                  </p>
                </div>

                {enhancedResult.improvements.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Improvements made:</span>
                    <ul className="mt-1 space-y-1">
                      {enhancedResult.improvements.map((imp, i) => (
                        <li key={i} className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    size="sm"
                    onClick={applyEnhancement}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Apply Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowEnhancePreview(false);
                      setEnhancedResult(null);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Keep Original
                  </Button>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {(isAnalyzing || aiClassification || aiPriority) && !showEnhancePreview && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Analysis</span>
                  {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {aiClassification && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Category: {aiClassification.category}
                      ({Math.round(aiClassification.confidence * 100)}%)
                    </span>
                    {aiPriority && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Priority: {aiPriority.priority}
                        (SLA: {aiPriority.slaHours}h)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Attachments (Optional)</CardTitle>
            <CardDescription>Upload images, documents, or videos as evidence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Click to upload files</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Images, PDFs, Videos (max 10MB each, up to 10 files)
                </span>
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anonymous Toggle */}
        <Card>
          <CardContent className="pt-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                {watch('isAnonymous') ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <span className="font-medium">Submit Anonymously</span>
                  <p className="text-sm text-muted-foreground">
                    Your identity will be hidden from handlers but stored for abuse prevention
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                {...register('isAnonymous')}
                className="h-5 w-5 rounded border-gray-300"
              />
            </label>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit {watch('type') === 'COMPLAINT' ? 'Complaint' : 'Suggestion'}
          </Button>
        </div>
      </form>
    </div>
  );
}

