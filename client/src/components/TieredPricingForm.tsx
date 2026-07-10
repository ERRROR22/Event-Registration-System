import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface PricingTier {
  tier: "early_bird" | "regular" | "vip" | "group";
  price: number;
  quantity: number;
  description?: string;
  validUntil?: Date;
}

interface TieredPricingFormProps {
  eventId: number;
  onPricingAdded?: (pricing: PricingTier) => void;
  existingPricing?: PricingTier[];
}

export default function TieredPricingForm({ eventId, onPricingAdded, existingPricing = [] }: TieredPricingFormProps) {
  const [tiers, setTiers] = useState<PricingTier[]>(existingPricing);
  const [selectedTier, setSelectedTier] = useState<"early_bird" | "regular" | "vip" | "group">("regular");
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(10);
  const [description, setDescription] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");

  const tierLabels: Record<string, string> = {
    early_bird: "Early Bird",
    regular: "Regular",
    vip: "VIP",
    group: "Group Discount",
  };

  const tierColors: Record<string, string> = {
    early_bird: "bg-green-100 text-green-800",
    regular: "bg-blue-100 text-blue-800",
    vip: "bg-purple-100 text-purple-800",
    group: "bg-orange-100 text-orange-800",
  };

  const handleAddTier = () => {
    if (price < 0) {
      toast.error("Price must be non-negative");
      return;
    }
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const newTier: PricingTier = {
      tier: selectedTier,
      price,
      quantity,
      description: description || undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
    };

    setTiers([...tiers, newTier]);
    onPricingAdded?.(newTier);
    
    // Reset form
    setPrice(0);
    setQuantity(10);
    setDescription("");
    setValidUntil("");
    
    toast.success(`${tierLabels[selectedTier]} tier added`);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    toast.success("Tier removed");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Pricing Tiers</CardTitle>
          <CardDescription>
            Create multiple pricing tiers to maximize revenue and reach different audience segments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Tier Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
            <h3 className="font-semibold text-sm">Add New Pricing Tier</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier-select">Tier Type</Label>
                <Select value={selectedTier} onValueChange={(value: any) => setSelectedTier(value)}>
                  <SelectTrigger id="tier-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early_bird">Early Bird</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="group">Group Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Available Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="valid-until">Valid Until (Optional)</Label>
                <Input
                  id="valid-until"
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., 'Limited to first 50 registrations'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <Button onClick={handleAddTier} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </div>

          {/* Existing Tiers Display */}
          {tiers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Configured Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tiers.map((tier, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${tierColors[tier.tier]}`}>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{tierLabels[tier.tier]}</Badge>
                      <button
                        onClick={() => handleRemoveTier(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold">${tier.price.toFixed(2)}</div>
                      <div className="text-xs opacity-75">{tier.quantity} available</div>
                      {tier.description && <div className="text-xs opacity-75">{tier.description}</div>}
                      {tier.validUntil && (
                        <div className="text-xs opacity-75">
                          Until: {new Date(tier.validUntil).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Summary */}
          {tiers.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">Pricing Summary</h4>
              <div className="space-y-1 text-sm">
                <div>Total Tiers: <span className="font-semibold">{tiers.length}</span></div>
                <div>Total Capacity: <span className="font-semibold">{tiers.reduce((sum, t) => sum + t.quantity, 0)}</span></div>
                <div>Price Range: <span className="font-semibold">${Math.min(...tiers.map(t => t.price)).toFixed(2)} - ${Math.max(...tiers.map(t => t.price)).toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
