"use client";

import { useState } from "react";

export type JobFormData = {
  // Customer
  customerName: string;
  collectionAddress: string;
  deliveryAddress: string;
  collectionContact: string;
  deliveryContact: string;
  // Goods
  goodsDescription: string;
  boxes: string;
  pallets: string;
  weight: string;
  dimensions: string;
  declaredValue: string;
  // Transport
  collectionDate: string;
  deliveryDate: string;
  dedicatedVehicle: boolean;
  twoMan: boolean;
  tailLift: boolean;
  timedDelivery: boolean;
  specialInstructions: string;
};

export type RequirementKey =
  | "dedicatedVehicle"
  | "twoMan"
  | "tailLift"
  | "timedDelivery";

export const JOB_REQUIREMENTS: { key: RequirementKey; label: string }[] = [
  { key: "dedicatedVehicle", label: "Dedicated Vehicle Required" },
  { key: "twoMan", label: "Two Man Required" },
  { key: "tailLift", label: "Tail Lift Required" },
  { key: "timedDelivery", label: "Timed Delivery Required" },
];

type ValidationErrors = Partial<Record<keyof JobFormData, string>>;

type JobDetailsFormProps = {
  initialData?: Partial<JobFormData>;
  onReview: (data: JobFormData) => void;
  onSaveDraft?: (data: JobFormData) => void;
  onBack: () => void;
};

const emptyForm: JobFormData = {
  customerName: "",
  collectionAddress: "",
  deliveryAddress: "",
  collectionContact: "",
  deliveryContact: "",
  goodsDescription: "",
  boxes: "",
  pallets: "",
  weight: "",
  dimensions: "",
  declaredValue: "",
  collectionDate: "",
  deliveryDate: "",
  dedicatedVehicle: false,
  twoMan: false,
  tailLift: false,
  timedDelivery: false,
  specialInstructions: "",
};

function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[var(--nexus-graphite)]"
    >
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[var(--nexus-graphite)] placeholder-slate-400 focus:border-[var(--nexus-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/20";

const textareaClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[var(--nexus-graphite)] placeholder-slate-400 focus:border-[var(--nexus-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/20 resize-none";

const errorClass = "mt-1 text-xs text-red-600";

const inputErrorClass =
  "mt-1 block w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-[var(--nexus-graphite)] placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";

const textareaErrorClass =
  "mt-1 block w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-[var(--nexus-graphite)] placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none";

export default function JobDetailsForm({
  initialData,
  onReview,
  onSaveDraft,
  onBack,
}: JobDetailsFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [draftSaved, setDraftSaved] = useState(false);

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!formData.customerName.trim())
      newErrors.customerName = "Customer name is required.";
    if (!formData.collectionAddress.trim())
      newErrors.collectionAddress = "Collection address is required.";
    if (!formData.deliveryAddress.trim())
      newErrors.deliveryAddress = "Delivery address is required.";
    if (!formData.goodsDescription.trim())
      newErrors.goodsDescription = "Goods description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof JobFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleReview = () => {
    if (validate()) {
      onReview(formData);
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(formData);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Customer section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">
          Customer
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel label="Customer Name" required htmlFor="customerName" />
            <input
              id="customerName"
              name="customerName"
              type="text"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g. Doorway Group LTD"
              className={errors.customerName ? inputErrorClass : inputClass}
            />
            {errors.customerName && (
              <p className={errorClass}>{errors.customerName}</p>
            )}
          </div>

          <div>
            <FieldLabel
              label="Collection Address"
              required
              htmlFor="collectionAddress"
            />
            <textarea
              id="collectionAddress"
              name="collectionAddress"
              rows={3}
              value={formData.collectionAddress}
              onChange={handleChange}
              placeholder="Full collection address"
              className={
                errors.collectionAddress ? textareaErrorClass : textareaClass
              }
            />
            {errors.collectionAddress && (
              <p className={errorClass}>{errors.collectionAddress}</p>
            )}
          </div>

          <div>
            <FieldLabel
              label="Delivery Address"
              required
              htmlFor="deliveryAddress"
            />
            <textarea
              id="deliveryAddress"
              name="deliveryAddress"
              rows={3}
              value={formData.deliveryAddress}
              onChange={handleChange}
              placeholder="Full delivery address"
              className={
                errors.deliveryAddress ? textareaErrorClass : textareaClass
              }
            />
            {errors.deliveryAddress && (
              <p className={errorClass}>{errors.deliveryAddress}</p>
            )}
          </div>

          <div>
            <FieldLabel
              label="Collection Contact"
              htmlFor="collectionContact"
            />
            <input
              id="collectionContact"
              name="collectionContact"
              type="text"
              value={formData.collectionContact}
              onChange={handleChange}
              placeholder="Name and phone number"
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel label="Delivery Contact" htmlFor="deliveryContact" />
            <input
              id="deliveryContact"
              name="deliveryContact"
              type="text"
              value={formData.deliveryContact}
              onChange={handleChange}
              placeholder="Name and phone number"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Goods section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">
          Goods
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel
              label="Goods Description"
              required
              htmlFor="goodsDescription"
            />
            <textarea
              id="goodsDescription"
              name="goodsDescription"
              rows={3}
              value={formData.goodsDescription}
              onChange={handleChange}
              placeholder="Describe the goods being transported"
              className={
                errors.goodsDescription ? textareaErrorClass : textareaClass
              }
            />
            {errors.goodsDescription && (
              <p className={errorClass}>{errors.goodsDescription}</p>
            )}
          </div>

          <div>
            <FieldLabel label="Boxes" htmlFor="boxes" />
            <input
              id="boxes"
              name="boxes"
              type="number"
              min="0"
              value={formData.boxes}
              onChange={handleChange}
              placeholder="0"
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel label="Pallets" htmlFor="pallets" />
            <input
              id="pallets"
              name="pallets"
              type="number"
              min="0"
              value={formData.pallets}
              onChange={handleChange}
              placeholder="0"
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel label="Weight" htmlFor="weight" />
            <input
              id="weight"
              name="weight"
              type="text"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g. 500 kg"
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel label="Dimensions" htmlFor="dimensions" />
            <input
              id="dimensions"
              name="dimensions"
              type="text"
              value={formData.dimensions}
              onChange={handleChange}
              placeholder="e.g. 120 × 80 × 100 cm"
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel label="Declared Value" htmlFor="declaredValue" />
            <input
              id="declaredValue"
              name="declaredValue"
              type="text"
              value={formData.declaredValue}
              onChange={handleChange}
              placeholder="e.g. £2,500"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Transport section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">
          Transport
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              label="Requested Collection Date"
              htmlFor="collectionDate"
            />
            <input
              id="collectionDate"
              name="collectionDate"
              type="date"
              value={formData.collectionDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel
              label="Requested Delivery Date"
              htmlFor="deliveryDate"
            />
            <input
              id="deliveryDate"
              name="deliveryDate"
              type="date"
              value={formData.deliveryDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-[var(--nexus-graphite)]">
              Requirements
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {JOB_REQUIREMENTS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-[var(--nexus-purple)]/40 hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData[key]}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--nexus-purple)] focus:ring-[var(--nexus-purple)]/30"
                  />
                  <span className="text-sm text-[var(--nexus-graphite)]">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <FieldLabel
              label="Special Instructions"
              htmlFor="specialInstructions"
            />
            <textarea
              id="specialInstructions"
              name="specialInstructions"
              rows={3}
              value={formData.specialInstructions}
              onChange={handleChange}
              placeholder="Any special handling instructions or notes"
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Back
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {draftSaved && (
            <span className="text-center text-xs font-medium text-emerald-600 sm:text-left">
              Draft saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleReview}
            className="rounded-lg bg-[var(--nexus-purple)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/40"
          >
            Review Job
          </button>
        </div>
      </div>
    </div>
  );
}
