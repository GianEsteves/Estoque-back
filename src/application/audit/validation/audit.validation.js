import * as yup from "yup";
function dateTransform(_value, original) {
  return original ? new Date(original) : undefined;
}
export const listAuditValidation = yup.object({
  actorId: yup.string().trim(),
  entityType: yup.string().trim().max(100),
  action: yup.string().trim().max(100),
  from: yup.date().transform(dateTransform),
  to: yup.date().transform(dateTransform),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
