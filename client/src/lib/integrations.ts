export type NormalizedAssignmentStatus =
  | "unknown"
  | "open"
  | "assigned"
  | "accepted"
  | "declined"
  | "removed";

export type OfficiatingCoverageStatus =
  | "unknown"
  | "open"
  | "partially_filled"
  | "filled_unconfirmed"
  | "confirmed"
  | "attention_needed";

export interface AssignmentStatusInput {
  normalized_status: NormalizedAssignmentStatus;
  is_deleted?: boolean;
}

export interface OfficiatingCoverageSummary {
  status: OfficiatingCoverageStatus;
  expectedPositions: number | null;
  slotCount: number;
  assignedCount: number;
  acceptedCount: number;
  declinedCount: number;
}

const REMOVED_WORDS = ["deleted", "removed", "unassigned", "cancelled", "canceled"];
const DECLINED_WORDS = ["declined", "rejected", "turned back", "turned-back"];
const ACCEPTED_WORDS = ["accepted", "confirmed"];
const ASSIGNED_WORDS = ["assigned", "notified", "published", "pending"];
const OPEN_WORDS = ["open", "unfilled", "vacant", "available"];

/**
 * Provider adapters should preserve the raw provider status and map it to this
 * small RVC vocabulary. This fallback is intentionally conservative so an
 * unfamiliar vendor status becomes `unknown` rather than a false assurance.
 */
export function normalizeAssignmentStatus(rawStatus: string | null | undefined): NormalizedAssignmentStatus {
  const value = rawStatus?.trim().toLowerCase();
  if (!value) return "unknown";

  if (REMOVED_WORDS.some((word) => value.includes(word))) return "removed";
  if (DECLINED_WORDS.some((word) => value.includes(word))) return "declined";
  if (ACCEPTED_WORDS.some((word) => value.includes(word))) return "accepted";
  if (ASSIGNED_WORDS.some((word) => value.includes(word))) return "assigned";
  if (OPEN_WORDS.some((word) => value.includes(word))) return "open";
  return "unknown";
}

export function summarizeOfficiatingCoverage(
  assignments: AssignmentStatusInput[],
  expectedPositions: number | null,
): OfficiatingCoverageSummary {
  const active = assignments.filter((assignment) => !assignment.is_deleted && assignment.normalized_status !== "removed");
  const assignedCount = active.filter((assignment) =>
    assignment.normalized_status === "assigned" || assignment.normalized_status === "accepted"
  ).length;
  const acceptedCount = active.filter((assignment) => assignment.normalized_status === "accepted").length;
  const declinedCount = active.filter((assignment) => assignment.normalized_status === "declined").length;

  let status: OfficiatingCoverageStatus = "unknown";
  if (declinedCount > 0) {
    status = "attention_needed";
  } else if (expectedPositions !== null && expectedPositions > 0 && acceptedCount >= expectedPositions) {
    status = "confirmed";
  } else if (expectedPositions !== null && expectedPositions > 0 && assignedCount >= expectedPositions) {
    status = "filled_unconfirmed";
  } else if (assignedCount > 0) {
    status = "partially_filled";
  } else if (expectedPositions !== null && expectedPositions > 0) {
    status = "open";
  }

  return {
    status,
    expectedPositions,
    slotCount: active.length,
    assignedCount,
    acceptedCount,
    declinedCount,
  };
}

export function coverageLabel(status: OfficiatingCoverageStatus): string {
  switch (status) {
    case "confirmed":
      return "Crew confirmed";
    case "filled_unconfirmed":
      return "Filled, awaiting acceptance";
    case "partially_filled":
      return "Partially filled";
    case "open":
      return "Open positions";
    case "attention_needed":
      return "Attention needed";
    default:
      return "Status unknown";
  }
}
