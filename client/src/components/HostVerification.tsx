import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Shield, AlertCircle, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface HostVerificationProps {
  hostId: number;
  isOwnProfile?: boolean;
}

export default function HostVerification({ hostId, isOwnProfile = false }: HostVerificationProps) {
  const { data: verification, isLoading, refetch } = trpc.verification.getHost.useQuery(hostId);
  const { data: trustBadge } = trpc.verification.getTrustBadge.useQuery(hostId);
  const updateVerification = trpc.verification.updateVerification.useMutation();

  const [verificationSteps, setVerificationSteps] = useState<any[]>([]);

  useEffect(() => {
    if (verification) {
      setVerificationSteps([
        {
          id: "email",
          label: "Email Verification",
          description: "Verify your email address",
          completed: verification.emailVerified,
          icon: "✉️",
        },
        {
          id: "phone",
          label: "Phone Verification",
          description: "Verify your phone number",
          completed: verification.phoneVerified,
          icon: "📱",
        },
        {
          id: "id",
          label: "ID Verification",
          description: "Verify your identity with government ID",
          completed: verification.idVerified,
          icon: "🪪",
        },
      ]);
    }
  }, [verification]);

  const handleVerify = async (stepId: string) => {
    try {
      const updates: any = {};
      if (stepId === "email") updates.emailVerified = true;
      if (stepId === "phone") updates.phoneVerified = true;
      if (stepId === "id") updates.idVerified = true;

      await updateVerification.mutateAsync({
        hostId,
        ...updates,
      });

      await refetch();
      toast.success(`${stepId} verification completed!`);
    } catch (error) {
      toast.error("Verification failed");
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />;
  }

  if (!verification) {
    return null;
  }

  const completedSteps = verificationSteps.filter((s) => s.completed).length;
  const progressPercent = (completedSteps / verificationSteps.length) * 100;
  const trustScorePercent = Math.min((verification.trustScore / 100) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Trust Badge Display */}
      {trustBadge && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">
                  {trustBadge === "verified" ? "Fully Verified Host" : "Email Verified Host"}
                </div>
                <div className="text-sm text-green-700">
                  {trustBadge === "verified"
                    ? "This host has completed all verification steps"
                    : "This host has verified their email address"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Verification Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Host Verification
          </CardTitle>
          <CardDescription>Build trust with attendees by completing verification steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Verification Progress</span>
              <span className="text-sm text-gray-600">{completedSteps} of 3 steps</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Trust Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-sm">Trust Score</div>
                <div className="text-xs text-gray-600">Based on verification and event history</div>
              </div>
              <div className="text-3xl font-bold text-blue-600">{verification.trustScore}</div>
            </div>
            <Progress value={trustScorePercent} className="h-2" />
          </div>

          {/* Host Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{verification.totalEventsHosted}</div>
              <div className="text-xs text-gray-600 mt-1">Events Hosted</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-yellow-500">{verification.averageRating}</span>
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="text-xs text-gray-600 mt-1">Average Rating</div>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Verification Steps</h3>
            <div className="space-y-3">
              {verificationSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0 mt-1">
                    {step.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{step.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{step.label}</div>
                        <div className="text-xs text-gray-600">{step.description}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    ) : isOwnProfile ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerify(step.id)}
                        disabled={updateVerification.isPending}
                      >
                        Verify
                      </Button>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-purple-900">Benefits of Verification</div>
                <ul className="text-xs text-purple-800 mt-2 space-y-1">
                  <li>✓ Display trust badges on your profile</li>
                  <li>✓ Higher visibility in event listings</li>
                  <li>✓ Increased attendee confidence</li>
                  <li>✓ Access to premium host features</li>
                  <li>✓ Priority support from EventHub team</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Warning for unverified */}
          {completedSteps === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <div className="font-semibold mb-1">Get verified to build trust</div>
                <p>Attendees are more likely to register for events hosted by verified organizers. Start verification today!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
