import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function CheckoutSuccess() {
  const { toast } = useToast();
  const { profile, fetchProfile } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [productType, setProductType] = useState('');

  useEffect(() => {
    let isMounted = true;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const sessionId = url.searchParams.get('session_id');

        if (!sessionId) {
          if (isMounted) setStatus('error');
          return;
        }

        // Confirm payment with server (Stripe)
        const res = await fetch(
          `/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.payment_status !== 'paid') {
          if (isMounted) setStatus('error');
          return;
        }

        const localProductType = String(data?.metadata?.productType || '');
        if (isMounted) {
          setProductType(localProductType);
        }

        // Refresh profile credits. Webhook may take a moment.
        // We do not depend on the local "profile" snapshot inside this effect.
        if (profile?.id) {
          for (let i = 0; i < 8; i++) {
            await fetchProfile(profile.id);
            await sleep(500);
          }
        }

        if (!isMounted) return;

        setStatus('ok');
        const creditCount = localProductType === 'pack_3' ? 3 : 1;
        toast({
          title: 'Payment received',
          description: `${creditCount} report credit${creditCount === 1 ? '' : 's'} has been added.`,
        });

setTimeout(() => {
  window.location.href = '/dashboard';
}, 3500);

      } catch (e) {
        console.error(e);
        if (isMounted) setStatus('error');
      }
    };

    run();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creditCount = productType === 'pack_3' ? 3 : 1;

  return (
    <div className="min-h-screen bg-white p-6 sm:p-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {status === 'loading' && (
            <>
              <div className="text-lg font-semibold text-[#0F172A]">Finalizing purchase</div>
              <div className="mt-2 text-sm text-[#334155]">
                Confirming payment and updating your account.
              </div>
            </>
          )}

          {status === 'ok' && (
            <>
              <div className="text-lg font-semibold text-[#0F172A]">Payment received</div>
              <div className="mt-2 text-sm text-[#334155]">
                {creditCount} report credit{creditCount === 1 ? '' : 's'}{' '}
                {creditCount === 1 ? 'has' : 'have'} been added to your account.
              </div>

              <div className="mt-6">
                <Button
                  size="lg"
                  onClick={() => (window.location.href = '/dashboard')}
                  className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
                >
                  Upload Documents
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-lg font-semibold text-[#0F172A]">Checkout complete</div>
              <div className="mt-2 text-sm text-[#334155]">
                We could not confirm payment details on this page. If payment was completed, your
                credits will appear shortly.
              </div>

              <div className="mt-6">
                <Button
                  size="lg"
                  onClick={() => (window.location.href = '/dashboard')}
                  className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
                >
                  Return to Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
