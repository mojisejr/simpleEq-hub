"use client";

import { useState } from "react";
import { Check, Shield, X, AlertTriangle, Key } from "lucide-react";
import { ConfirmationModal } from "./confirmation-modal";
import { manageLicenseAction } from "../actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface License {
  productId: string;
  active: boolean;
  expiresAt: Date | null | string; // Date from DB might be string in client component if passed directly from server component props without serialization
}

interface LicenseManagerProps {
  userId: string;
  userEmail: string;
  products: Product[];
  initialLicenses: License[];
}

export function LicenseManager({
  userId,
  userEmail,
  products,
  initialLicenses,
}: LicenseManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionPending, setActionPending] = useState<{
    productId: string;
    action: "grant" | "revoke";
    productName: string;
  } | null>(null);

  const getLicense = (productId: string) =>
    initialLicenses.find((l) => l.productId === productId);

  const handleToggle = (product: Product) => {
    const license = getLicense(product.id);
    const isActive = license?.active ?? false;
    
    setActionPending({
      productId: product.id,
      action: isActive ? "revoke" : "grant",
      productName: product.name,
    });
  };

  const executeAction = async () => {
    if (!actionPending) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("targetUserId", userId);
      formData.append("productId", actionPending.productId); // we need to change action to accept productId or lookup slug.
      // Wait, action accepts 'productSlug'. Let's check schema.
      // Schema: productSlug: z.string().trim().min(1),
      // But we passed ID. We need to pass slug or change action to accept ID.
      // Let's assume action accepts productId for now or fix action.
      // Actually, Product has 'key' which is usually the slug.
      const product = products.find(p => p.id === actionPending.productId);
      if (!product) throw new Error("Product not found");

      formData.append("productSlug", product.slug); 
      formData.append("action", actionPending.action === "grant" ? "activate" : "revoke");
      formData.append("note", `Manual ${actionPending.action} via Admin Cockpit`);

      await manageLicenseAction(null, formData);
      
      // Refresh to show updated state
      router.refresh();
      setActionPending(null);
    } catch (error) {
      console.error("Failed to update license:", error);
      alert("Failed to update license. See console.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground flex items-center gap-1.5 transition-colors"
      >
        <Key className="h-3.5 w-3.5" />
        Licenses
      </button>

      {/* Main Manager Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-xl bg-card p-6 shadow-lg border border-border animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-semibold tracking-tight">License Management</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Managing access for <span className="font-medium text-foreground">{userEmail}</span>
              </p>
            </div>

            <div className="space-y-3">
              {products.map((product) => {
                const license = getLicense(product.id);
                const isActive = license?.active ?? false;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border",
                          isActive
                            ? "border-green-500/20 bg-green-500/10 text-green-600"
                            : "border-muted-foreground/20 bg-muted text-muted-foreground"
                        )}
                      >
                        {isActive ? (
                          <Shield className="h-5 w-5" />
                        ) : (
                          <Shield className="h-5 w-5 opacity-40" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.slug}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(product)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all shadow-sm",
                        isActive
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {isActive ? "Revoke" : "Grant"}
                    </button>
                  </div>
                );
              })}
              
              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
                  No products defined in the system.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      <ConfirmationModal
        isOpen={!!actionPending}
        title={
          actionPending?.action === "grant"
            ? `Grant Access to ${actionPending.productName}`
            : `Revoke Access from ${actionPending?.productName}`
        }
        message={
          actionPending?.action === "grant" ? (
            <span className="flex items-start gap-2 text-sm">
               <Shield className="h-5 w-5 text-green-600 mt-0.5" />
               <span>
                  Are you sure you want to <strong>grant</strong> a license for <strong>{actionPending.productName}</strong> to this user? 
                  <br className="my-2"/>
                  This will immediately enable access to premium features associated with this product.
               </span>
            </span>
          ) : (
            <span className="flex items-start gap-2 text-sm">
               <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
               <span>
                  Are you sure you want to <strong>revoke</strong> the license for <strong>{actionPending?.productName}</strong>?
                  <br className="my-2"/>
                  The user will immediately lose access. This action is logged for audit purposes.
               </span>
            </span>
          )
        }
        confirmLabel={actionPending?.action === "grant" ? "Grant Access" : "Revoke Access"}
        variant={actionPending?.action === "revoke" ? "destructive" : "primary"}
        isProcessing={isProcessing}
        onConfirm={executeAction}
        onCancel={() => setActionPending(null)}
      />
    </>
  );
}
