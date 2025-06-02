import joi from 'joi';
const Joi = joi;


// Schema for invoice lines
const invoiceLineSchema = Joi.object({
  invoiceLineId: Joi.number().integer().optional(),
  paymentRequestId: Joi.number().integer().optional(),
  schemeCode: Joi.string().required(),
  accountCode: Joi.string().allow(null).optional(),
  fundCode: Joi.string().required(),
  agreementNumber: Joi.string().allow(null).optional(),
  description: Joi.string().required(),
  value: Joi.number().required(),
  convergence: Joi.boolean().optional(),
  deliveryBody: Joi.string().required(),
  marketingYear: Joi.number().integer().required(),
  stateAid: Joi.boolean().optional(),
  invalid: Joi.boolean().optional()
});

// Schema for scheme information
const schemeSchema = Joi.object({
  schemeId: Joi.number().integer().required(),
  name: Joi.string().required(),
  active: Joi.boolean().required()
});

// Schema for attached by information
const attachedBySchema = Joi.object({
  userId: Joi.string().guid().required(),
  username: Joi.string().required()
});

// Schema for status information
const statusSchema = Joi.object({
  name: Joi.string().required(),
  detail: Joi.string().optional(),
  state: Joi.string().required(),
  default: Joi.boolean().optional()
});

// Schema for event data
const eventDataSchema = Joi.object({
  paymentRequestId: Joi.number().integer().optional(),
  categoryId: Joi.number().integer().optional(),
  schemeId: Joi.number().integer().required(),
  sourceSystem: Joi.string().required(),
  batch: Joi.string().optional(),
  deliveryBody: Joi.string().required(),
  invoiceNumber: Joi.string().required(),
  frn: Joi.string().required(),
  sbi: Joi.string().allow(null).optional(),
  vendor: Joi.string().allow(null).optional(),
  trader: Joi.string().allow(null).optional(),
  ledger: Joi.string().optional(),
  marketingYear: Joi.number().integer().required(),
  paymentRequestNumber: Joi.number().integer().required(),
  contractNumber: Joi.string().required(),
  agreementNumber: Joi.string().optional(),
  currency: Joi.string().length(3).required(),
  schedule: Joi.string().allow(null).optional(),
  dueDate: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/)
  ).required(),
  debtType: Joi.string().allow(null).optional(),
  recoveryDate: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/)
  ).allow(null).optional(),
  originalSettlementDate: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/)
  ).allow(null).optional(),
  originalInvoiceNumber: Joi.string().allow(null).optional(),
  invoiceCorrectionReference: Joi.string().allow(null).optional(),
  value: Joi.number().required(),
  netValue: Joi.number().allow(null).optional(),
  received: Joi.date().iso().optional(),
  released: Joi.date().iso().allow(null).optional(),
  referenceId: Joi.string().guid().optional(),
  correlationId: Joi.string().guid().required(),
  paymentType: Joi.string().allow(null).optional(),
  pillar: Joi.string().allow(null).optional(),
  exchangeRate: Joi.number().allow(null).optional(),
  eventDate: Joi.date().iso().allow(null).optional(),
  claimDate: Joi.date().iso().allow(null).optional(),
  sentToTracking: Joi.boolean().optional(),
  invoiceLines: Joi.array().items(invoiceLineSchema).required(),
  scheme: schemeSchema.optional(),
  attachedBy: attachedBySchema.optional()
});

// Schema for individual events
const eventSchema = Joi.object({
  etag: Joi.string().required(),
  partitionKey: Joi.string().required(),
  rowKey: Joi.string().required(),
  timestamp: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/).required(),
  category: Joi.string().required(),
  data: eventDataSchema.required(),
  datacontenttype: Joi.string().required(),
  id: Joi.string().guid().required(),
  source: Joi.string().required(),
  specversion: Joi.string().required(),
  subject: Joi.string().optional(),
  time: Joi.date().iso().required(),
  type: Joi.string().required(),
  status: statusSchema.required()
});

// Schema for main payment data item
const paymentDataItemSchema = Joi.object({
  frn: Joi.string().required(),
  correlationId: Joi.string().guid().required(),
  schemeId: Joi.number().integer().required(),
  paymentRequestNumber: Joi.number().integer().required(),
  agreementNumber: Joi.string().required(),
  marketingYear: Joi.number().integer().required(),
  events: Joi.array().items(eventSchema).min(1).required(),
  scheme: Joi.string().required(),
  status: statusSchema.required(),
  lastUpdated: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/).required(),
  originalValue: Joi.number().required(),
  originalValueText: Joi.string().required(),
  currentValue: Joi.number().required(),
  currentValueText: Joi.string().required()
});

// Main schema for the entire JSON structure
const paymentDataSchema = Joi.object({
  data: Joi.array().items(paymentDataItemSchema).min(1).required()
});

export default {
  paymentDataSchema,
  paymentDataItemSchema,
  eventSchema,
  eventDataSchema,
  invoiceLineSchema,
  schemeSchema,
  statusSchema,
  attachedBySchema
};