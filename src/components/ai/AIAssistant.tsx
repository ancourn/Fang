'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  FileText, 
  MessageSquare, 
  Search, 
  TrendingUp, 
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react';
import { DocumentAnalysis } from './DocumentAnalysis';
import { useAuth } from '@/contexts/AuthContext';

interface AIAssistantProps {
  workspaceId: string;
}

interface ContentGeneration {
  id: string;
  type: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export function AIAssistant({ workspaceId }: AIAssistantProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analysis');
  const [contentPrompt, setContentPrompt] = useState('');
  const [contentType, setContentType] = useState('document');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<ContentGeneration[]>([]);
  const [error, setError] = useState('');

  const contentTypes = [
    { value: 'document', label: 'Document Content', icon: FileText, description: 'Generate document content' },
    { value: 'email', label: 'Email', icon: MessageSquare, description: 'Write professional emails' },
    { value: 'summary', label: 'Summary', icon: Target, description: 'Create concise summaries' },
    { value: 'title', label: 'Title', icon: Sparkles, description: 'Generate catchy titles' },
    { value: 'translation', label: 'Translation', icon: MessageSquare, description: 'Translate text' },
  ];

  const handleContentGeneration = async () => {
    if (!contentPrompt.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/content-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: contentPrompt,
          type: contentType,
          context: { workspaceId }
        }),
      });

      if (!response.ok) {
        throw new Error('Content generation failed');
      }

      const result = await response.json();
      setGenerations(prev => [result, ...prev]);
      setContentPrompt('');
    } catch (err) {
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    const contentTypeObj = contentTypes.find(ct => ct.value === type);
    const Icon = contentTypeObj?.icon || Brain;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">Leverage AI to enhance your productivity</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Smart Search
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Document Analysis
              </CardTitle>
              <CardDescription>
                Analyze your documents to gain insights and improve content quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentAnalysis documentId="" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Content Generation
              </CardTitle>
              <CardDescription>
                Use AI to generate high-quality content for various purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Describe what you want to generate..."
                value={contentPrompt}
                onChange={(e) => setContentPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {contentPrompt.length}/500 characters
                </div>
                <Button 
                  onClick={handleContentGeneration} 
                  disabled={!contentPrompt.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Content'
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {generations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Generations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generations.map((generation) => (
                  <div key={generation.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(generation.type)}
                        <Badge variant="outline" className="capitalize">
                          {generation.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(generation.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Prompt:</div>
                      <div className="text-muted-foreground mb-2">{generation.prompt}</div>
                      <div className="font-medium mb-1">Response:</div>
                      <div className="bg-muted p-3 rounded text-sm">
                        {generation.response}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Smart Search
              </CardTitle>
              <CardDescription>
                AI-powered search across all your workspace content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across documents, messages, files..."
                  className="pl-10"
                />
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Smart search coming soon!</p>
                <p className="text-sm">This feature will use AI to understand context and provide relevant results.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Workspace Insights
              </CardTitle>
              <CardDescription>
                AI-powered insights about your workspace activity and productivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Workspace insights coming soon!</p>
                <p className="text-sm">This feature will analyze your workspace activity and provide actionable insights.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}