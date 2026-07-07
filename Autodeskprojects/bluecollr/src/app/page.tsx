import Link from 'next/link';
import { formatCurrency } from '@/utils/currency';

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            Professional estimates in 60 seconds
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Built for plumbers, electricians, HVAC techs, roofers, and painters.
            Generate branded PDF estimates your customers are proud to receive — no software subscription required.
          </p>
          <div className="mt-8">
            <Link
              href="/estimate"
              title="Opens the estimate builder"
              className="inline-block rounded bg-blue-600 px-8 py-3 text-base sm:text-lg font-semibold text-white hover:bg-blue-700 active:scale-[0.98] transition-transform"
            >
              Start Generating Estimates
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">1. Enter your details</h3>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">
                Add your company name, contact info, and logo. Fill in your client&apos;s details and the services or materials you&apos;re quoting.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">2. Add line items</h3>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">
                List every service with quantity and rate. Add notes, tax, and deposit — everything the customer needs to say yes.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">3. Send the PDF</h3>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">
                One click downloads a polished, branded PDF estimate. Text or email it instantly and win more jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for trades */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Built for trades</h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 text-center max-w-2xl mx-auto">
            No monthly bills. No training. Open your browser, fill in the blanks, and send a professional estimate in under a minute.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">Mobile-first</h3>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">
                Designed for the job site. Works smoothly on phones and tablets so you can quote on the spot.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">Auto-save</h3>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">
                Drafts save automatically in your browser. Pick up right where you left off — no sign-up needed.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">Branded PDFs</h3>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">
                Upload your logo, set your company info, and generate clean, professional estimates every time.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">No subscription</h3>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">
                Use it for free. Upgrade once to unlock pro features — no recurring bills, no lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample estimate preview */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">See what you get</h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 text-center max-w-2xl mx-auto">
            Every estimate includes a clean header, itemized table, and clear totals — exactly what your customer expects.
            Example shown below in USD; your estimates support USD, GBP, CAD, AUD, and EUR.
          </p>
          <div className="mt-10 mx-auto max-w-2xl rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
            {/* Static mockup of an estimate */}
            <div className="rounded border border-gray-200 bg-white p-6" style={{ minHeight: '280px' }}>
              <div className="flex items-start justify-between border-b-2 border-gray-800 pb-5 mb-6">
                <div>
                  <div className="text-lg font-bold text-gray-900">Your Company</div>
                  <div className="text-sm text-gray-600 mt-1">(555) 123-4567</div>
                  <div className="text-sm text-gray-600">you@example.com</div>
                </div>
                <div className="text-right pt-1">
                  <div className="text-base font-bold tracking-widest uppercase text-gray-800">Estimate</div>
                  <div className="text-sm text-gray-500 mt-1">Date</div>
                </div>
              </div>
              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bill To</div>
                <div className="font-semibold text-gray-900">Client Name</div>
                <div className="text-sm text-gray-600">123 Main St</div>
                <div className="text-sm text-gray-600">(555) 987-6543</div>
              </div>
              <table className="w-full mb-6 border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="text-left py-2 px-3 font-semibold w-[55%]">Description</th>
                    <th className="text-right py-2 px-3 font-semibold w-[10%]">Qty</th>
                    <th className="text-right py-2 px-3 font-semibold w-[15%]">Rate</th>
                    <th className="text-right py-2 px-3 font-semibold w-[20%]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 border-b border-gray-200 text-gray-800">Service or material</td>
                    <td className="text-right py-2.5 px-3 border-b border-gray-200 text-gray-800">2</td>
                    <td className="text-right py-2.5 px-3 border-b border-gray-200 text-gray-800">{formatCurrency(150, 'USD')}</td>
                    <td className="text-right py-2.5 px-3 border-b border-gray-200 font-medium text-gray-900">{formatCurrency(300, 'USD')}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-2.5 px-3 border-b border-gray-200 text-gray-800">Labor — install</td>
                    <td className="text-right py-2.5 px-3 border-b border-gray-200 text-gray-800">3</td>
                    <td className="text-right py-2.5 px-3 border-b border-gray-200 text-gray-800">{formatCurrency(95, 'USD')}</td>
                    <td className="text-right py-2.5 px-3 border-b border-gray-200 font-medium text-gray-900">{formatCurrency(285, 'USD')}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="w-60 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-500 uppercase text-xs tracking-wide">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatCurrency(585, 'USD')}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-base border-t-2 border-gray-800 mt-1">
                    <span className="uppercase tracking-wide">Total Due</span>
                    <span className="tabular-nums">{formatCurrency(585, 'USD')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ready to send cleaner estimates?</h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Stop losing jobs to messy paperwork. Create your first branded estimate right now — no account needed.
          </p>
          <div className="mt-8">
            <Link
              href="/estimate"
              title="Opens the estimate builder"
              className="inline-block rounded bg-blue-600 px-8 py-3 text-base sm:text-lg font-semibold text-white hover:bg-blue-700 active:scale-[0.98] transition-transform"
            >
              Start Generating Estimates
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
