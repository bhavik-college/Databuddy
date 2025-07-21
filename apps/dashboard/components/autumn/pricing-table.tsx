import React from "react";
import { useCustomer, usePricingTable } from "autumn-js/react";
import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import AttachDialog from "@/components/autumn/attach-dialog";
import { getPricingTableContent } from "@/lib/autumn/pricing-table-content";
import type { Product, ProductItem } from "autumn-js";
import { PricingTiersTooltip } from "@/app/(main)/billing/components/pricing-tiers-tooltip";
import { Star } from "@phosphor-icons/react";

export default function PricingTable({
  productDetails,
}: {
  productDetails?: any;
}) {
  const { attach } = useCustomer();
  const [isAnnual, setIsAnnual] = useState(false);
  const { products, isLoading, error, refetch } = usePricingTable({ productDetails });

  const [hobbyPro, setHobbyPro] = useState<'hobby' | 'pro'>('pro');
  const [scaleBuddy, setScaleBuddy] = useState<'scale' | 'buddy'>('buddy');

  const summary =
    "All plans include unlimited team members, full analytics, and priority support.";

  const PricingTableSkeleton = () => (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-secondary/40 border rounded-lg h-64 max-w-xl w-full mx-auto flex flex-col p-6">
          <div className="h-6 bg-zinc-300/60 rounded w-1/2 mb-4" />
          <div className="h-4 bg-zinc-200/60 rounded w-1/3 mb-2" />
          <div className="h-4 bg-zinc-200/60 rounded w-2/3 mb-6" />
          <div className="flex-1" />
          <div className="h-10 bg-zinc-300/60 rounded w-full mt-4" />
        </div>
      ))}
    </div>
  );

  const handleRetry = useCallback(() => {
    if (typeof refetch === "function") refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center min-h-[300px]" aria-live="polite">
        <PricingTableSkeleton />
        <span className="mt-4 text-muted-foreground text-sm">Loading pricing plans…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center min-h-[300px]" aria-live="polite">
        <span className="text-destructive font-medium mb-2">Something went wrong loading pricing plans.</span>
        <button
          type="button"
          className="mt-2 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition"
          onClick={handleRetry}
          aria-label="Retry loading pricing plans"
        >
          Retry
        </button>
      </div>
    );
  }

  const intervals = Array.from(
    new Set(
      products?.map((p) => p.properties?.interval_group).filter((i) => !!i)
    )
  );

  const multiInterval = intervals.length > 1;

  const intervalFilter = (product: any) => {
    if (!product.properties?.interval_group) {
      return true;
    }

    if (multiInterval) {
      if (isAnnual) {
        return product.properties?.interval_group === "year";
      }
      return product.properties?.interval_group === "month";
    }

    return true;
  };

  const freePlan = products?.find(p => p.id === 'free' && intervalFilter(p));
  const hobbyPlan = products?.find(p => p.id === 'hobby' && intervalFilter(p));
  const proPlan = products?.find(p => p.id === 'pro' && intervalFilter(p));
  const scalePlan = products?.find(p => p.id === 'scale' && intervalFilter(p));
  const buddyPlan = products?.find(p => p.id === 'buddy' && intervalFilter(p));

  const showHobbyProToggle = !!hobbyPlan && !!proPlan;
  const showScaleBuddyToggle = !!scalePlan && !!buddyPlan;

  return (
    <section className={cn("root")}
      aria-labelledby="pricing-table-title"
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div
          className="flex-1 p-4 rounded bg-secondary/60 border text-base font-medium text-foreground shadow-sm text-center sm:text-left"
          id="pricing-table-title"
        >
          {summary}
        </div>
        {multiInterval && (
          <div className="flex items-center justify-center mt-2 sm:mt-0">
            <div className="flex rounded-full bg-muted border p-1">
              <button
                type="button"
                className={cn(
                  "px-4 py-1 rounded-full text-sm font-medium transition focus:outline-none",
                  !isAnnual ? 'bg-primary text-primary-foreground shadow' : 'bg-transparent text-foreground'
                )}
                onClick={() => setIsAnnual(false)}
                aria-pressed={!isAnnual}
              >
                Monthly
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-1 rounded-full text-sm font-medium transition focus:outline-none",
                  isAnnual ? 'bg-primary text-primary-foreground shadow' : 'bg-transparent text-foreground'
                )}
                onClick={() => setIsAnnual(true)}
                aria-pressed={isAnnual}
              >
                Annual
              </button>
            </div>
          </div>
        )}
      </div>
      {products && (
        <PricingTableContainer
          products={products as any}
          isAnnualToggle={isAnnual}
          setIsAnnualToggle={setIsAnnual}
          multiInterval={multiInterval}
        >
          {freePlan && (
            <div className="mb-6 pt-[46px]">
              <PricingCard
                key={freePlan.id}
                productId={freePlan.id}
                buttonProps={{
                  disabled:
                    freePlan.scenario === "active" ||
                    freePlan.scenario === "scheduled",
                  onClick: async () => {
                    await attach({
                      productId: freePlan.id,
                      dialog: AttachDialog,
                    });
                  },
                  "aria-label": freePlan.display?.recommend_text ? `Select recommended plan: ${freePlan.display?.name}` : `Select plan: ${freePlan.display?.name}`
                }}
              />
            </div>
          )}

          {(hobbyPlan || proPlan) && (
            <div className="mb-6">
              {showHobbyProToggle && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    type="button"
                    className={cn(
                      "px-4 py-1 rounded-full border text-sm font-medium transition",
                      hobbyPro === 'hobby' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    )}
                    onClick={() => setHobbyPro('hobby')}
                    aria-pressed={hobbyPro === 'hobby'}
                  >
                    Hobby
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "px-4 py-1 rounded-full border text-sm font-medium transition",
                      hobbyPro === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    )}
                    onClick={() => setHobbyPro('pro')}
                    aria-pressed={hobbyPro === 'pro'}
                  >
                    Pro
                  </button>
                </div>
              )}
              {(!showHobbyProToggle && hobbyPlan) && (
                <PricingCard
                  key={hobbyPlan.id}
                  productId={hobbyPlan.id}
                  buttonProps={{
                    disabled:
                      hobbyPlan.scenario === "active" ||
                      hobbyPlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: hobbyPlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": hobbyPlan.display?.recommend_text ? `Select recommended plan: ${hobbyPlan.display?.name}` : `Select plan: ${hobbyPlan.display?.name}`
                  }}
                />
              )}
              {(!showHobbyProToggle && proPlan) && (
                <PricingCard
                  key={proPlan.id}
                  productId={proPlan.id}
                  buttonProps={{
                    disabled:
                      proPlan.scenario === "active" ||
                      proPlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: proPlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": proPlan.display?.recommend_text ? `Select recommended plan: ${proPlan.display?.name}` : `Select plan: ${proPlan.display?.name}`
                  }}
                />
              )}
              {showHobbyProToggle && hobbyPro === 'hobby' && hobbyPlan && (
                <PricingCard
                  key={hobbyPlan.id}
                  productId={hobbyPlan.id}
                  buttonProps={{
                    disabled:
                      hobbyPlan.scenario === "active" ||
                      hobbyPlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: hobbyPlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": hobbyPlan.display?.recommend_text ? `Select recommended plan: ${hobbyPlan.display?.name}` : `Select plan: ${hobbyPlan.display?.name}`
                  }}
                />
              )}
              {showHobbyProToggle && hobbyPro === 'pro' && proPlan && (
                <PricingCard
                  key={proPlan.id}
                  productId={proPlan.id}
                  buttonProps={{
                    disabled:
                      proPlan.scenario === "active" ||
                      proPlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: proPlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": proPlan.display?.recommend_text ? `Select recommended plan: ${proPlan.display?.name}` : `Select plan: ${proPlan.display?.name}`
                  }}
                />
              )}
            </div>
          )}

          {(scalePlan || buddyPlan) && (
            <div>
              {showScaleBuddyToggle && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    type="button"
                    className={cn(
                      "px-4 py-1 rounded-full border text-sm font-medium transition",
                      scaleBuddy === 'scale' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    )}
                    onClick={() => setScaleBuddy('scale')}
                    aria-pressed={scaleBuddy === 'scale'}
                  >
                    Scale
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "px-4 py-1 rounded-full border text-sm font-medium transition",
                      scaleBuddy === 'buddy' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    )}
                    onClick={() => setScaleBuddy('buddy')}
                    aria-pressed={scaleBuddy === 'buddy'}
                  >
                    Buddy
                  </button>
                </div>
              )}
              {(!showScaleBuddyToggle && scalePlan) && (
                <PricingCard
                  key={scalePlan.id}
                  productId={scalePlan.id}
                  buttonProps={{
                    disabled:
                      scalePlan.scenario === "active" ||
                      scalePlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: scalePlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": scalePlan.display?.recommend_text ? `Select recommended plan: ${scalePlan.display?.name}` : `Select plan: ${scalePlan.display?.name}`
                  }}
                />
              )}
              {(!showScaleBuddyToggle && buddyPlan) && (
                <PricingCard
                  key={buddyPlan.id}
                  productId={buddyPlan.id}
                  buttonProps={{
                    disabled:
                      buddyPlan.scenario === "active" ||
                      buddyPlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: buddyPlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": buddyPlan.display?.recommend_text ? `Select recommended plan: ${buddyPlan.display?.name}` : `Select plan: ${buddyPlan.display?.name}`
                  }}
                />
              )}
              {showScaleBuddyToggle && scaleBuddy === 'scale' && scalePlan && (
                <PricingCard
                  key={scalePlan.id}
                  productId={scalePlan.id}
                  buttonProps={{
                    disabled:
                      scalePlan.scenario === "active" ||
                      scalePlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: scalePlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": scalePlan.display?.recommend_text ? `Select recommended plan: ${scalePlan.display?.name}` : `Select plan: ${scalePlan.display?.name}`
                  }}
                />
              )}
              {showScaleBuddyToggle && scaleBuddy === 'buddy' && buddyPlan && (
                <PricingCard
                  key={buddyPlan.id}
                  productId={buddyPlan.id}
                  buttonProps={{
                    disabled:
                      buddyPlan.scenario === "active" ||
                      buddyPlan.scenario === "scheduled",
                    onClick: async () => {
                      await attach({
                        productId: buddyPlan.id,
                        dialog: AttachDialog,
                      });
                    },
                    "aria-label": buddyPlan.display?.recommend_text ? `Select recommended plan: ${buddyPlan.display?.name}` : `Select plan: ${buddyPlan.display?.name}`
                  }}
                />
              )}
            </div>
          )}
        </PricingTableContainer>
      )}
    </section>
  );
}

const PricingTableContext = createContext<{
  isAnnualToggle: boolean;
  setIsAnnualToggle: (isAnnual: boolean) => void;
  products: Product[];
  showFeatures: boolean;
}>({
  isAnnualToggle: false,
  setIsAnnualToggle: () => { },
  products: [],
  showFeatures: true,
});

export const usePricingTableContext = (componentName: string) => {
  const context = useContext(PricingTableContext);

  if (context === undefined) {
    throw new Error(`${componentName} must be used within <PricingTable />`);
  }

  return context;
};

export const PricingTableContainer = ({
  children,
  products,
  showFeatures = true,
  className,
  isAnnualToggle,
  setIsAnnualToggle,
  multiInterval,
}: {
  children?: React.ReactNode;
  products?: Product[];
  showFeatures?: boolean;
  className?: string;
  isAnnualToggle: boolean;
  setIsAnnualToggle: (isAnnual: boolean) => void;
  multiInterval: boolean;
}) => {
  if (!products) {
    throw new Error("products is required in <PricingTable />");
  }

  if (products.length === 0) {
    return <></>;
  }

  const hasRecommended = products?.some((p) => p.display?.recommend_text);
  return (
    <PricingTableContext.Provider
      value={{ isAnnualToggle, setIsAnnualToggle, products, showFeatures }}
    >
      <div
        className={cn(
          "flex items-center flex-col",
          hasRecommended && "!py-10"
        )}
      >
        {multiInterval && (
          <div
            className={cn(
              products.some((p) => p.display?.recommend_text) && "mb-8"
            )}
          >
            <AnnualSwitch
              isAnnualToggle={isAnnualToggle}
              setIsAnnualToggle={setIsAnnualToggle}
            />
          </div>
        )}
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] w-full gap-2",
            className
          )}
        >
          {children}
        </div>
      </div>
    </PricingTableContext.Provider>
  );
};

interface PricingCardProps {
  productId: string;
  showFeatures?: boolean;
  className?: string;
  onButtonClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  buttonProps?: React.ComponentProps<"button">;
}

export const PricingCard = ({
  productId,
  className,
  buttonProps,
}: PricingCardProps) => {
  const { products, showFeatures } = usePricingTableContext("PricingCard");

  const product = products.find((p) => p.id === productId);

  if (!product) {
    throw new Error(`Product with id ${productId} not found`);
  }

  const { name, display: productDisplay, items } = product;

  const { buttonText } = getPricingTableContent(product);
  const isRecommended = !!productDisplay?.recommend_text;
  const mainPriceDisplay = product.properties?.is_free
    ? {
      primary_text: "Free",
    }
    : product.items[0].display;

  // Determine support level based on plan id
  let supportLevel: { display: { primary_text: string } } | null = null;
  switch (product.id) {
    case 'free':
      supportLevel = { display: { primary_text: 'Community Support' } };
      break;
    case 'hobby':
      supportLevel = { display: { primary_text: 'Email Support' } };
      break;
    case 'pro':
      supportLevel = { display: { primary_text: 'Priority Email Support' } };
      break;
    case 'scale':
    case 'buddy':
      supportLevel = { display: { primary_text: 'Priority Email + Slack Support' } };
      break;
    default:
      supportLevel = null;
  }

  // Add extra features for higher plans
  const extraFeatures: { display: { primary_text: string } }[] =
    ['scale', 'buddy'].includes(product.id)
      ? [
        { display: { primary_text: 'White Glove Onboarding' } },
        { display: { primary_text: 'Beta/Early Access' } },
      ]
      : [];

  // Add support feature as the last item if supportLevel exists
  const featureItems = product.properties?.is_free
    ? (supportLevel ? [...product.items, ...extraFeatures, supportLevel] : [...product.items, ...extraFeatures])
    : (supportLevel ? [...product.items.slice(1), ...extraFeatures, supportLevel] : [...product.items.slice(1), ...extraFeatures]);

  return (
    <div
      className={cn(
        "w-full h-full py-6 text-foreground border rounded-lg shadow-sm max-w-xl relative transition-all duration-300",
        isRecommended &&
        "lg:-translate-y-6 lg:shadow-lg dark:shadow-zinc-800/80 lg:h-[calc(100%+48px)] bg-secondary/40 border-primary animate-recommended-glow",
        className
      )}
      aria-label={isRecommended ? "Recommended plan" : undefined}
    >
      {isRecommended && (
        <RecommendedBadge recommended={productDisplay?.recommend_text ?? ""} />
      )}
      <div
        className={cn(
          "flex flex-col h-full flex-grow",
          isRecommended && "lg:translate-y-6"
        )}
      >
        <div className="h-full">
          <div className="flex flex-col">
            <div className="pb-4">
              <h2 className="text-2xl font-semibold px-6 truncate">
                {productDisplay?.name || name}
              </h2>
              {productDisplay?.description && (
                <div className="text-sm text-muted-foreground px-6 h-8">
                  <p className="line-clamp-2">
                    {productDisplay?.description}
                  </p>
                </div>
              )}
            </div>
            <div className="mb-2">
              <h3 className="font-semibold h-16 flex px-6 items-center border-y mb-4 bg-secondary/40">
                <div className="line-clamp-2">
                  {mainPriceDisplay?.primary_text}{" "}
                  {mainPriceDisplay?.secondary_text && (
                    <span className="font-normal text-muted-foreground mt-1">
                      {mainPriceDisplay?.secondary_text}
                    </span>
                  )}
                </div>
              </h3>
            </div>
          </div>
          {showFeatures && featureItems.length > 0 && (
            <div className="flex-grow px-6 mb-6">
              <PricingFeatureList
                items={featureItems}
                showIcon={true}
                everythingFrom={product.display?.everything_from}
              />
            </div>
          )}
        </div>
        <div
          className={cn(" px-6 ", isRecommended && "lg:-translate-y-12")}
        >
          <PricingCardButton
            recommended={!!productDisplay?.recommend_text}
            {...buttonProps}
          >
            {buttonText}
          </PricingCardButton>
        </div>
      </div>
    </div>
  );
};

// Pricing Feature List
export const PricingFeatureList = ({
  items,
  showIcon = true,
  everythingFrom,
  className,
}: {
  items: ProductItem[];
  showIcon?: boolean;
  everythingFrom?: string;
  className?: string;
}) => {
  return (
    <div className={cn("flex-grow", className)}>
      {everythingFrom && (
        <p className="text-sm mb-4">
          Everything from {everythingFrom}, plus:
        </p>
      )}
      <div className="space-y-3">
        {items.map((item) => {
          const featureItem = item as any;
          let secondaryText = featureItem.display?.secondary_text;

          const hasTiers =
            featureItem.type === "priced_feature" &&
            featureItem.tiers?.length > 0;

          if (hasTiers) {
            secondaryText = "Usage-based pricing";
          }

          return (
            <div
              key={featureItem.display?.primary_text}
              className="flex items-start gap-2 text-sm"
            >
              {showIcon && (
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col">
                <span>{featureItem.display?.primary_text}</span>
                <div className="flex items-center gap-1">
                  {secondaryText && (
                    <span className="text-sm text-muted-foreground">
                      {secondaryText}
                    </span>
                  )}
                  {hasTiers && (
                    <PricingTiersTooltip
                      tiers={featureItem.tiers}
                      showText={false}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Pricing Card Button
export interface PricingCardButtonProps extends React.ComponentProps<"button"> {
  recommended?: boolean;
  buttonUrl?: string;
}

export const PricingCardButton = React.forwardRef<
  HTMLButtonElement,
  PricingCardButtonProps
>(({ recommended, children, className, onClick, ...props }, ref) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    try {
      await onClick?.(e);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className={cn(
        "w-full py-3 px-4 group overflow-hidden relative transition-all duration-300 hover:brightness-90 border rounded-lg",
        className
      )}
      {...props}
      variant={recommended ? "default" : "secondary"}
      ref={ref}
      disabled={loading || props.disabled}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <div className="flex items-center justify-between w-full transition-transform duration-300 group-hover:translate-y-[-130%]">
            <span>{children}</span>
            <span className="text-sm">→</span>
          </div>
          <div className="flex items-center justify-between w-full absolute px-4 translate-y-[130%] transition-transform duration-300 group-hover:translate-y-0 mt-2 group-hover:mt-0">
            <span>{children}</span>
            <span className="text-sm">→</span>
          </div>
        </>
      )}
    </Button>
  );
});
PricingCardButton.displayName = "PricingCardButton";

// Annual Switch
export const AnnualSwitch = ({
  isAnnualToggle,
  setIsAnnualToggle,
}: {
  isAnnualToggle: boolean;
  setIsAnnualToggle: (isAnnual: boolean) => void;
}) => {
  return (
    <div className="flex flex-col items-center space-y-1 mb-4">
      <span className="text-sm font-medium text-foreground" id="billing-interval-label">
        Choose billing interval
      </span>
      <div className="flex items-center space-x-2" aria-labelledby="billing-interval-label">
        <span className="text-sm text-muted-foreground">Monthly</span>
        <Switch
          id="annual-billing"
          checked={isAnnualToggle}
          onCheckedChange={setIsAnnualToggle}
          aria-label="Toggle annual billing"
        >
          <span className="sr-only">Toggle annual billing</span>
        </Switch>
        <span className="text-sm text-muted-foreground">Annual</span>
      </div>
    </div>
  );
};

export const RecommendedBadge = ({ recommended }: { recommended: string }) => {
  return (
    <div className="bg-primary/90 border border-primary text-primary-foreground text-sm font-medium lg:rounded-full px-3 lg:py-0.5 lg:top-4 lg:right-4 top-[-1px] right-[-1px] rounded-bl-lg absolute flex items-center gap-1 shadow-md animate-bounce-in">
      <Star weight="duotone" className="w-4 h-4" aria-hidden="true" />
      <span>{recommended}</span>
    </div>
  );
};

<style jsx global>{`
  @keyframes recommended-glow {
    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
    70% { box-shadow: 0 0 16px 8px rgba(99, 102, 241, 0.15); }
    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  }
  .animate-recommended-glow {
    animation: recommended-glow 2.5s infinite;
  }
  @keyframes bounce-in {
    0% { transform: scale(0.8); opacity: 0; }
    60% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); }
  }
  .animate-bounce-in {
    animation: bounce-in 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  }
`}</style>


