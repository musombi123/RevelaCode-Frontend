import React, { useEffect, useState } from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CircleDollarSign,
  History,
  Plus,
  WalletCards,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// PAYMENTS / WALLET DASHBOARD
// =========================================================

export default function PaymentsDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getWalletLedger,
    recordWalletTransaction,
  } = useJumuiyaApi();

  const [wallet, setWallet] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showTransactionForm, setShowTransactionForm] =
    useState(false);

  const [direction, setDirection] =
    useState("credit");

  const [amount, setAmount] =
    useState("");

  const [type, setType] =
    useState("general");

  const [reference, setReference] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  // =======================================================
  // LOAD WALLET
  // =======================================================

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getWalletLedger();

      setWallet(
        result || {
          balance: 0,
          currency: "KES",
          transactions: [],
        }
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load wallet."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadWallet();
  }, []);


  // =======================================================
  // RECORD TRANSACTION
  // =======================================================

  const submitTransaction = async (
    e
  ) => {
    e.preventDefault();

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid amount greater than zero."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      await recordWalletTransaction({
        type,
        direction,
        amount:
          numericAmount,
        currency: "KES",
        reference:
          reference.trim(),
        description:
          description.trim(),
      });

      setAmount("");
      setReference("");
      setDescription("");

      setShowTransactionForm(
        false
      );

      await loadWallet();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to record transaction."
      );
    } finally {
      setSaving(false);
    }
  };


  const transactions =
    wallet?.transactions ||
    [];

  const balance =
    Number(
      wallet?.balance || 0
    );

  const currency =
    wallet?.currency ||
    "KES";


  return (
    <JumuiyaDashboardShell
      title="Payments"
      subtitle="Your Jumuiya wallet and transaction center."
      activeHub=""
      user={user}
      onNavigate={onNavigate}
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          overflow-hidden
          rounded-3xl
          bg-slate-950
          px-5
          py-7
          text-white
          shadow-xl
          sm:px-7
          sm:py-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div>
            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-white/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-emerald-200
              "
            >
              <WalletCards size={14} />
              Jumuiya Wallet
            </div>

            <h2
              className="
                text-2xl
                font-bold
                tracking-tight
                sm:text-3xl
              "
            >
              Your money, connected.
            </h2>

            <p
              className="
                mt-2
                max-w-xl
                text-sm
                leading-6
                text-slate-300
              "
            >
              Keep track of your Jumuiya
              transactions and wallet activity
              across the ecosystem.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowTransactionForm(
                true
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-emerald-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              hover:bg-emerald-500
            "
          >
            <Plus size={17} />
            Record transaction
          </button>
        </div>
      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="
            mt-5
            flex
            items-center
            justify-between
            gap-3
            rounded-2xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
            dark:border-red-900/40
            dark:bg-red-950/20
            dark:text-red-300
          "
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={17} />
          </button>
        </div>
      )}


      {/* =====================================================
          TRANSACTION FORM
      ===================================================== */}

      {showTransactionForm && (
        <section
          className="
            mt-5
            rounded-2xl
            border
            border-emerald-200
            bg-white
            p-5
            shadow-lg
            dark:border-emerald-900/40
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h3 className="font-semibold">
                Record wallet transaction
              </h3>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                Use this for supported ledger
                records. Payment integrations
                can be connected later.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowTransactionForm(
                  false
                )
              }
            >
              <X
                size={18}
                className="text-slate-400"
              />
            </button>
          </div>

          <form
            onSubmit={
              submitTransaction
            }
            className="
              mt-5
              grid
              gap-3
              md:grid-cols-2
            "
          >
            <select
              value={direction}
              onChange={(e) =>
                setDirection(
                  e.target.value
                )
              }
              className="
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                dark:border-white/10
                dark:bg-slate-950
              "
            >
              <option value="credit">
                Credit
              </option>

              <option value="debit">
                Debit
              </option>
            </select>

            <input
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              className="
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                outline-none
                focus:border-emerald-500
                dark:border-white/10
                dark:bg-slate-950
              "
            />

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value
                )
              }
              className="
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                dark:border-white/10
                dark:bg-slate-950
              "
            >
              <option value="general">
                General
              </option>

              <option value="sale">
                Sale
              </option>

              <option value="expense">
                Expense
              </option>

              <option value="fee">
                School fee
              </option>

              <option value="farm_input">
                Farm input
              </option>

              <option value="marketplace">
                Marketplace
              </option>
            </select>

            <input
              value={reference}
              onChange={(e) =>
                setReference(
                  e.target.value
                )
              }
              placeholder="Reference (optional)"
              className="
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                dark:border-white/10
                dark:bg-slate-950
              "
            />

            <input
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Description"
              className="
                md:col-span-2
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                dark:border-white/10
                dark:bg-slate-950
              "
            />

            <div
              className="
                flex
                gap-3
                md:col-span-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  setShowTransactionForm(
                    false
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  font-medium
                  dark:border-white/10
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="
                  rounded-xl
                  bg-emerald-600
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-emerald-700
                  disabled:opacity-60
                "
              >
                {saving
                  ? "Saving..."
                  : "Save transaction"}
              </button>
            </div>
          </form>
        </section>
      )}


      {/* =====================================================
          BALANCE
      ===================================================== */}

      <section
        className="
          mt-5
          grid
          gap-4
          lg:grid-cols-[1.4fr_0.6fr]
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-700
                dark:bg-emerald-950/30
                dark:text-emerald-400
              "
            >
              <CircleDollarSign
                size={21}
              />
            </div>

            <div>
              <div
                className="
                  text-xs
                  text-slate-400
                "
              >
                Available balance
              </div>

              <div className="text-sm font-semibold">
                Jumuiya Wallet
              </div>
            </div>
          </div>

          <div
            className="
              mt-6
              text-4xl
              font-black
              tracking-tight
            "
          >
            {loading
              ? "..."
              : `${currency} ${balance.toLocaleString()}`}
          </div>

          <p
            className="
              mt-2
              text-xs
              text-slate-400
            "
          >
            Current ledger balance
          </p>
        </div>


        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              font-semibold
            "
          >
            <History
              size={19}
              className="text-emerald-600"
            />

            Transactions
          </div>

          <div
            className="
              mt-5
              text-3xl
              font-bold
            "
          >
            {transactions.length}
          </div>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            Recorded wallet activities
          </p>
        </div>
      </section>


      {/* =====================================================
          TRANSACTION HISTORY
      ===================================================== */}

      <section
        className="
          mt-5
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          dark:border-white/10
          dark:bg-slate-900
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <h3 className="font-semibold">
              Transaction history
            </h3>

            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              Recent activity from your
              Jumuiya ledger.
            </p>
          </div>
        </div>

        {loading ? (
          <div
            className="
              mt-5
              space-y-3
            "
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-16
                    animate-pulse
                    rounded-xl
                    bg-slate-100
                    dark:bg-white/5
                  "
                />
              )
            )}
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="
              mt-5
              rounded-xl
              border
              border-dashed
              border-slate-200
              p-8
              text-center
              dark:border-white/10
            "
          >
            <WalletCards
              size={30}
              className="
                mx-auto
                text-slate-400
              "
            />

            <div
              className="
                mt-3
                text-sm
                font-semibold
              "
            >
              No transactions yet
            </div>

            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              Your wallet activity will
              appear here.
            </p>
          </div>
        ) : (
          <div
            className="
              mt-5
              divide-y
              divide-slate-100
              dark:divide-white/5
            "
          >
            {transactions
              .slice(0, 20)
              .map((transaction) => {
                const credit =
                  transaction.direction ===
                  "credit";

                return (
                  <div
                    key={
                      transaction.id ||
                      transaction._id
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      py-4
                    "
                  >
                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${
                          credit
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                            : "bg-red-50 text-red-600 dark:bg-red-950/20"
                        }
                      `}
                    >
                      {credit ? (
                        <ArrowDownLeft
                          size={18}
                        />
                      ) : (
                        <ArrowUpRight
                          size={18}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="
                          truncate
                          text-sm
                          font-semibold
                        "
                      >
                        {transaction.description ||
                          transaction.type ||
                          "Transaction"}
                      </div>

                      <div
                        className="
                          mt-1
                          flex
                          flex-wrap
                          gap-2
                          text-xs
                          text-slate-400
                        "
                      >
                        <span>
                          {transaction.type ||
                            "general"}
                        </span>

                        {transaction.reference && (
                          <>
                            <span>•</span>

                            <span>
                              {
                                transaction.reference
                              }
                            </span>
                          </>
                        )}

                        {transaction.created_at && (
                          <>
                            <span>•</span>

                            <span>
                              {new Date(
                                transaction.created_at
                              ).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className={`
                        shrink-0
                        text-sm
                        font-bold
                        ${
                          credit
                            ? "text-emerald-600"
                            : "text-red-600"
                        }
                      `}
                    >
                      {credit
                        ? "+"
                        : "-"}
                      {Number(
                        transaction.amount ||
                          0
                      ).toLocaleString()}{" "}
                      {transaction.currency ||
                        currency}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>


      {/* =====================================================
          ECOSYSTEM
      ===================================================== */}

      <section
        className="
          mt-5
          rounded-2xl
          border
          border-emerald-100
          bg-emerald-50
          p-5
          dark:border-emerald-900/40
          dark:bg-emerald-950/20
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <div className="font-semibold">
              One wallet across Jumuiya
            </div>

            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              The wallet layer is designed to
              become the common financial layer
              for Biashara, Shamba, Elimu and
              marketplace transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                "biashara"
              )
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-emerald-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              hover:bg-emerald-700
            "
          >
            Explore hubs
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </JumuiyaDashboardShell>
  );
}