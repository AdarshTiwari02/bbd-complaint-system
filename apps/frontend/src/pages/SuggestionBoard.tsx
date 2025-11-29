import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { suggestionApi, organizationApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatTimeAgo, getCategoryColor } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Lightbulb, Filter, Loader2 } from 'lucide-react';

interface Suggestion {
  id: string;
  ticketId: string;
  upvotes: number;
  downvotes: number;
  featuredAt?: string;
  ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    description: string;
    category: string;
    createdAt: string;
    college?: { id: string; name: string; code: string };
    department?: { id: string; name: string; code: string };
  };
}

interface College {
  id: string;
  name: string;
  code: string;
}

export default function SuggestionBoard() {
  const { isAuthenticated } = useAuthStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [sortBy, setSortBy] = useState<'upvotes' | 'createdAt'>('upvotes');
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    organizationApi.getColleges().then((res) => {
      setColleges(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [selectedCollege, sortBy]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await suggestionApi.getPublic({
        collegeId: selectedCollege || undefined,
        sortBy,
        limit: 50,
      });
      setSuggestions(response.data.data.data || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (suggestionId: string, isUpvote: boolean) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    setVotingId(suggestionId);
    try {
      await suggestionApi.vote(suggestionId, isUpvote);
      // Optimistic update
      setSuggestions((prev) =>
        prev.map((s) => {
          if (s.id === suggestionId) {
            return {
              ...s,
              upvotes: isUpvote ? s.upvotes + 1 : s.upvotes,
              downvotes: !isUpvote ? s.downvotes + 1 : s.downvotes,
            };
          }
          return s;
        })
      );
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Suggestion Board</h1>
            <p className="text-muted-foreground">
              Community suggestions approved by moderators. Vote for ideas you support!
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">All Colleges</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'upvotes' | 'createdAt')}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="upvotes">Most Popular</option>
              <option value="createdAt">Most Recent</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Suggestions Yet</h3>
            <p className="text-muted-foreground mt-2">
              Be the first to submit a suggestion for this category!
            </p>
            <Button className="mt-4" asChild>
              <a href="/submit">Submit a Suggestion</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              className={`transition-shadow hover:shadow-md ${
                suggestion.featuredAt ? 'border-primary ring-1 ring-primary/20' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {suggestion.featuredAt && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          ⭐ Featured
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(suggestion.ticket.category)}`}>
                        {suggestion.ticket.category}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{suggestion.ticket.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {suggestion.ticket.college?.name}
                      {suggestion.ticket.department && ` • ${suggestion.ticket.department.name}`}
                      {' • '}
                      {formatTimeAgo(suggestion.ticket.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleVote(suggestion.id, true)}
                      disabled={votingId === suggestion.id}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{suggestion.upvotes}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleVote(suggestion.id, false)}
                      disabled={votingId === suggestion.id}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>{suggestion.downvotes}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {suggestion.ticket.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

