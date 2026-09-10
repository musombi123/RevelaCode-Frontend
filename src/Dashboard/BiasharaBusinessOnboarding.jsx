import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Store,
} from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";


const BUSINESS_CATEGORIES = [
  "Retail",
  "Wholesale",
  "Food & Beverage",
  "Agriculture",
  "Fashion",
  "Electronics",
  "Beauty & Personal Care",
  "Professional Services",
  "Construction",
  "Transport & Logistics",
  "Education",
  "Health",
  "Other",
];


const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Company",
  "Cooperative",
  "Family Business",
  "Other",
];


export default function BiasharaBusinessOnboarding({
  onCreated,
}) {
  const {
    createBiasharaBusiness,
  } = useJumuiyaApi();

  const [form, setForm] = useState({
    name: "",
    category: "",
    business_type: "",
    phone: "",
    email: "",
    county: "",
    location: "",
    description: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const updateField = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };


  const isValid = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.category.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.county.trim().length > 0 &&
      form.location.trim().length > 0
    );
  }, [form]);


  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!isValid) {
      setError(
        "Please complete all required business details.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const business =
        await createBiasharaBusiness({
          name: form.name.trim(),
          category:
            form.category.trim(),
          business_type:
            form.business_type.trim(),
          phone:
            form.phone.trim(),
          email:
            form.email.trim(),
          county:
            form.county.trim(),
          location:
            form.location.trim(),
          description:
            form.description.trim(),
          currency: "KES",
          logo_url: "",
          payment_methods: [
            "cash",
            "mpesa",
          ],
          opening_hours: {},
        });

      setSuccess(
        "Your business account has been created successfully.",
      );

      if (onCreated) {
        onCreated(
          business,
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create your business account.",
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">

        {/* ==================================================
            HERO
        ================================================== */}

        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-xl sm:p-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Briefcase
                  size={25}
                />
              </div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                Biashara Hub
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Create your business account
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Set up your business once and manage
                products, customers, orders, sales,
                inventory and growth from one place.
              </p>
            </div>


            <div className="hidden shrink-0 md:block">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">

                <Store
                  size={42}
                />

                <p className="mt-3 text-sm font-semibold">
                  Built for business
                </p>

                <p className="mt-1 max-w-[180px] text-xs leading-5 text-blue-100">
                  Your business becomes the centre
                  of your Biashara workspace.
                </p>
              </div>
            </div>

          </div>
        </div>


        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >

          {/* Header */}

          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">

            <h2 className="text-lg font-bold text-slate-900">
              Business information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tell us a little about your business.
              You can update these details later.
            </p>

          </div>


          <div className="space-y-7 p-5 sm:p-7">

            {/* ==================================================
                IDENTITY
            ================================================== */}

            <section>

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase
                    size={17}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Business identity
                  </h3>

                  <p className="text-xs text-slate-500">
                    The information customers will associate
                    with your business.
                  </p>
                </div>

              </div>


              <div className="grid gap-5 md:grid-cols-2">

                {/* Business name */}

                <Field
                  label="Business name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value,
                    )
                  }
                  placeholder="e.g. Musombi Electronics"
                />


                {/* Category */}

                <SelectField
                  label="Business category"
                  required
                  value={form.category}
                  onChange={(value) =>
                    updateField(
                      "category",
                      value,
                    )
                  }
                  options={
                    BUSINESS_CATEGORIES
                  }
                  placeholder="Select a category"
                />


                {/* Business type */}

                <SelectField
                  label="Business type"
                  value={
                    form.business_type
                  }
                  onChange={(value) =>
                    updateField(
                      "business_type",
                      value,
                    )
                  }
                  options={
                    BUSINESS_TYPES
                  }
                  placeholder="Select business type"
                />

              </div>

            </section>


            {/* ==================================================
                CONTACT
            ================================================== */}

            <section>

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Phone
                    size={17}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Contact information
                  </h3>

                  <p className="text-xs text-slate-500">
                    Give customers a reliable way to reach
                    your business.
                  </p>
                </div>

              </div>


              <div className="grid gap-5 md:grid-cols-2">

                {/* Phone */}

                <Field
                  label="Business phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value,
                    )
                  }
                  placeholder="07XXXXXXXX"
                  icon={
                    <Phone size={16} />
                  }
                />


                {/* Email */}

                <Field
                  label="Business email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField(
                      "email",
                      value,
                    )
                  }
                  placeholder="business@example.com"
                  icon={
                    <Mail size={16} />
                  }
                />

              </div>

            </section>


            {/* ==================================================
                LOCATION
            ================================================== */}

            <section>

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <MapPin
                    size={17}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Business location
                  </h3>

                  <p className="text-xs text-slate-500">
                    Help customers know where your business
                    operates.
                  </p>
                </div>

              </div>


              <div className="grid gap-5 md:grid-cols-2">

                <Field
                  label="County"
                  required
                  value={form.county}
                  onChange={(value) =>
                    updateField(
                      "county",
                      value,
                    )
                  }
                  placeholder="e.g. Mombasa"
                />


                <Field
                  label="Location"
                  required
                  value={form.location}
                  onChange={(value) =>
                    updateField(
                      "location",
                      value,
                    )
                  }
                  placeholder="e.g. Mwembe Tayari"
                />

              </div>

            </section>


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <section>

              <div className="mb-4">

                <h3 className="text-sm font-semibold text-slate-900">
                  Business description
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Give customers a quick idea of what your
                  business does.
                </p>

              </div>


              <textarea
                value={
                  form.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                rows={5}
                maxLength={2000}
                placeholder="Tell customers about your business..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-2 flex justify-end text-xs text-slate-400">
                {form.description.length}/2000
              </div>

            </section>


            {/* ==================================================
                ERROR / SUCCESS
            ================================================== */}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}


            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {success}
                </span>

              </div>
            )}


            {/* ==================================================
                SUBMIT
            ================================================== */}

            <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Ready to launch your business?
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  You can complete or update your profile
                  later.
                </p>
              </div>


              <button
                type="submit"
                disabled={
                  loading ||
                  !isValid
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Business Account
                    <ArrowRight
                      size={17}
                    />
                  </>
                )}
              </button>

            </div>

          </div>

        </form>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="py-6 text-center text-xs text-slate-400">
          Powered by RevelaCode · Biashara Hub
        </div>

      </div>
    </div>
  );
}


// =========================================================
// FIELD
// =========================================================

function Field({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = "text",
  icon = null,
}) {
  return (
    <label className="block">

      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">

        {label}

        {required && (
          <span className="text-red-500">
            *
          </span>
        )}

      </div>


      <div className="relative">

        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder={
            placeholder
          }
          maxLength={500}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${
            icon
              ? "pl-10"
              : ""
          }`}
        />

      </div>

    </label>
  );
}


// =========================================================
// SELECT FIELD
// =========================================================

function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <label className="block">

      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">

        {label}

        {required && (
          <span className="text-red-500">
            *
          </span>
        )}

      </div>


      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      >

        <option value="">
          {placeholder}
        </option>

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}

      </select>

    </label>
  );
}
