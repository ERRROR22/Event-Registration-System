import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";

interface EventSurveyProps {
  eventId: number;
  attendeeId: number;
  onSubmitted?: () => void;
}

export default function EventSurvey({ eventId, attendeeId, onSubmitted }: EventSurveyProps) {
  const [rating, setRating] = useState<number>(5);
  const [npsScore, setNpsScore] = useState<number>(8);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitSurvey = trpc.surveys.submit.useMutation();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSurvey.mutateAsync({
        eventId,
        attendeeId,
        rating,
        feedback,
        npsScore,
      });
      toast.success("Thank you for your feedback!");
      setFeedback("");
      setRating(5);
      setNpsScore(8);
      onSubmitted?.();
    } catch (error) {
      toast.error("Failed to submit survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Event Feedback</CardTitle>
        <CardDescription>Help us improve by sharing your experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">How would you rate this event?</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </div>
        </div>

        {/* NPS Score */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How likely are you to recommend this event to a friend?
          </Label>
          <div className="flex gap-1 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                onClick={() => setNpsScore(score)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  npsScore === score
                    ? "bg-blue-600 text-white scale-110"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </div>

        {/* Feedback Text */}
        <div className="space-y-3">
          <Label htmlFor="feedback" className="text-base font-semibold">
            Additional Comments
          </Label>
          <Textarea
            id="feedback"
            placeholder="What did you like most? What could be improved? Any suggestions?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="text-xs text-gray-500">
            {feedback.length} / 500 characters
          </div>
        </div>

        {/* Sentiment Indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
            <ThumbsUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-xs font-semibold text-green-700">What Worked</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
            <div className="text-xl mb-1">🎯</div>
            <div className="text-xs font-semibold text-yellow-700">Suggestions</div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
            <ThumbsDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <div className="text-xs font-semibold text-red-700">Improvements</div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !feedback.trim()}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <div className="font-semibold mb-1">Your feedback matters!</div>
          <p>Event organizers use this feedback to improve future events. Thank you for helping us create better experiences.</p>
        </div>
      </CardContent>
    </Card>
  );
}
