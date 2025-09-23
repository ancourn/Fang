'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, FileText, TrendingUp, MessageSquare, Eye, Lightbulb } from 'lucide-react';

interface DocumentAnalysisProps {
  documentId: string;
  documentContent?: string;
}

interface AnalysisResult {
  id: string;
  analysisType: string;
  result: any;
  confidence: number;
  processingTime: number;
  createdAt: string;
}

export function DocumentAnalysis({ documentId, documentContent }: DocumentAnalysisProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState('');

  const analysisTypes = [
    { value: 'summary', label: 'Summary', icon: FileText, description: 'Generate a comprehensive summary' },
    { value: 'keywords', label: 'Keywords', icon: TrendingUp, description: 'Extract key terms and phrases' },
    { value: 'sentiment', label: 'Sentiment', icon: MessageSquare, description: 'Analyze emotional tone' },
    { value: 'readability', label: 'Readability', icon: Eye, description: 'Assess reading level and clarity' },
    { value: 'insights', label: 'Insights', icon: Lightbulb, description: 'Generate business insights and recommendations' }
  ];

  const handleAnalyze = async () => {
    if (!selectedAnalysis) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          analysisType: selectedAnalysis
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResults(prev => [result, ...prev]);
    } catch (err) {
      setError('Failed to analyze document. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getAnalysisIcon = (type: string) => {
    const analysisType = analysisTypes.find(at => at.value === type);
    const Icon = analysisType?.icon || Brain;
    return <Icon className="h-4 w-4" />;
  };

  const renderAnalysisResult = (result: AnalysisResult) => {
    const { analysisType, result: data, confidence, processingTime } = result;

    switch (analysisType) {
      case 'summary':
        return (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed">{data.summary}</p>
            </div>
          </div>
        );

      case 'keywords':
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {data.keywords?.map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'sentiment':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge 
                variant={data.sentiment === 'positive' ? 'default' : data.sentiment === 'negative' ? 'destructive' : 'secondary'}
              >
                {data.sentiment?.toUpperCase() || 'NEUTRAL'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Confidence: {(data.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        );

      case 'readability':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Score</div>
                <div className="text-2xl font-bold">{data.score}/100</div>
              </div>
              <div>
                <div className="text-sm font-medium">Level</div>
                <div className="text-lg capitalize">{data.level}</div>
              </div>
            </div>
            {data.suggestions?.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Suggestions</div>
                <ul className="text-sm space-y-1">
                  {data.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-muted-foreground">• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-4">
            {data.keyInsights?.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Key Insights</div>
                <ul className="text-sm space-y-1">
                  {data.keyInsights.map((insight: string, index: number) => (
                    <li key={index} className="text-muted-foreground">• {insight}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.recommendations?.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Recommendations</div>
                <ul className="text-sm space-y-1">
                  {data.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="text-muted-foreground">• {recommendation}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.actionItems?.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Action Items</div>
                <ul className="text-sm space-y-1">
                  {data.actionItems.map((action: string, index: number) => (
                    <li key={index} className="text-muted-foreground">• {action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-sm text-muted-foreground">No results available</div>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Document Analysis
          </CardTitle>
          <CardDescription>
            Use AI to analyze your document and gain insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                {analysisTypes.map((type) => {
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
            <Button 
              onClick={handleAnalyze} 
              disabled={!selectedAnalysis || isAnalyzing}
              className="min-w-[100px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
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

      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Analysis Results</h3>
          {analysisResults.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAnalysisIcon(result.analysisType)}
                    <CardTitle className="text-base capitalize">
                      {analysisTypes.find(at => at.value === result.analysisType)?.label || result.analysisType}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getConfidenceColor(result.confidence)}>
                      {(result.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {result.processingTime}ms
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderAnalysisResult(result)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}