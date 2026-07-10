import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Zap, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LoyaltyProgramProps {
  attendeeId: number;
}

const tierConfig = {
  bronze: { color: "bg-amber-600", label: "Bronze", minPoints: 0, icon: "🥉" },
  silver: { color: "bg-gray-400", label: "Silver", minPoints: 200, icon: "🥈" },
  gold: { color: "bg-yellow-500", label: "Gold", minPoints: 500, icon: "🥇" },
  platinum: { color: "bg-blue-400", label: "Platinum", minPoints: 1000, icon: "💎" },
};

export default function LoyaltyProgram({ attendeeId }: LoyaltyProgramProps) {
  const { data: loyaltyData, isLoading } = trpc.loyalty.getPoints.useQuery(attendeeId);
  const [tierInfo, setTierInfo] = useState<any>(null);

  useEffect(() => {
    if (loyaltyData) {
      setTierInfo(tierConfig[loyaltyData.tier as keyof typeof tierConfig]);
    }
  }, [loyaltyData]);

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />;
  }

  if (!loyaltyData) {
    return null;
  }

  const nextTierPoints = {
    bronze: 200,
    silver: 500,
    gold: 1000,
    platinum: Infinity,
  }[loyaltyData.tier];

  const pointsToNextTier = nextTierPoints - loyaltyData.totalPoints;
  const progressPercent = (loyaltyData.totalPoints / nextTierPoints) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Loyalty Program
        </CardTitle>
        <CardDescription>Earn points for every event you attend</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Current Tier</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{tierInfo?.icon}</span>
              <div>
                <div className="font-semibold text-lg">{tierInfo?.label}</div>
                <div className="text-xs text-gray-500">{loyaltyData.totalPoints} points</div>
              </div>
            </div>
          </div>
          <Badge className={`${tierInfo?.color} text-white`}>
            {loyaltyData.tier.toUpperCase()}
          </Badge>
        </div>

        {/* Progress to Next Tier */}
        {loyaltyData.tier !== "platinum" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress to Next Tier</span>
              <span className="font-semibold">{pointsToNextTier} points to go</span>
            </div>
            <Progress value={Math.min(progressPercent, 100)} className="h-2" />
            <div className="text-xs text-gray-500">
              {loyaltyData.totalPoints} / {nextTierPoints} points
            </div>
          </div>
        )}

        {/* Tier Benefits */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Tier Benefits</div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(tierConfig).map(([key, tier]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border ${
                  loyaltyData.tier === key
                    ? `${tier.color} text-white border-current`
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="text-lg mb-1">{tier.icon}</div>
                <div className="font-semibold text-sm">{tier.label}</div>
                <div className="text-xs opacity-75">{tier.minPoints}+ pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-blue-900">How to Earn Points</div>
              <ul className="text-xs text-blue-800 mt-1 space-y-1">
                <li>• 10 points for each event registration</li>
                <li>• 5 bonus points for early bird registrations</li>
                <li>• 20 bonus points for event check-in</li>
                <li>• Referral bonuses: 50 points per successful referral</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tier Perks */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-purple-900">Your Tier Perks</div>
              <ul className="text-xs text-purple-800 mt-1 space-y-1">
                {loyaltyData.tier === "bronze" && (
                  <>
                    <li>✓ Access to member-only events</li>
                    <li>✓ Early notification of new events</li>
                  </>
                )}
                {["silver", "gold", "platinum"].includes(loyaltyData.tier) && (
                  <>
                    <li>✓ 5% discount on all events</li>
                    <li>✓ Priority registration</li>
                    <li>✓ Exclusive member events</li>
                  </>
                )}
                {["gold", "platinum"].includes(loyaltyData.tier) && (
                  <>
                    <li>✓ 10% discount on all events</li>
                    <li>✓ VIP event access</li>
                  </>
                )}
                {loyaltyData.tier === "platinum" && (
                  <>
                    <li>✓ 15% discount on all events</li>
                    <li>✓ Lifetime VIP status</li>
                    <li>✓ Personal event concierge</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
