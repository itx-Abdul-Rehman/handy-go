import Joi from 'joi';

export const triggerSOSSchema = Joi.object({
  bookingId: Joi.string().optional(),
  reason: Joi.string().required().max(100),
  description: Joi.string().required().max(1000),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required(),
  evidence: Joi.object({
    images: Joi.array().items(Joi.string().uri()).max(5).optional(),
    audioUrl: Joi.string().uri().optional(),
  }).optional(),
});

export const updateSOSSchema = Joi.object({
  description: Joi.string().max(1000).optional(),
  evidence: Joi.object({
    images: Joi.array().items(Joi.string().uri()).max(5).optional(),
    audioUrl: Joi.string().uri().optional(),
  }).optional(),
});

export const resolveSOSSchema = Joi.object({
  action: Joi.string().required().max(500),
  notes: Joi.string().max(1000).optional(),
});

export const escalateSOSSchema = Joi.object({
  reason: Joi.string().required().max(500),
});

export const getActiveSOSSchema = Joi.object({
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

export const getSOSHistorySchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'RESOLVED', 'ESCALATED', 'FALSE_ALARM').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

export const markFalseAlarmSchema = Joi.object({
  reason: Joi.string().required().max(500),
  penalizeUser: Joi.boolean().default(false),
});
