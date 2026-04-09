export type PlanType = "free" | "premium" | "pro";
export type SessionStatus = "draft" | "running" | "advisors_completed" | "peer_review_completed" | "completed" | "failed";
export type MessageRole = "user" | "contrarian" | "first_principles" | "expansionist" | "outsider" | "executor" | "peer_review" | "chairman" | string;
export type DecisionStatus = "planned" | "in_progress" | "completed" | "abandoned";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  plan: PlanType;
  createdAt: number;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  status: DecisionStatus;
  decidedAt: number;
  expectedOutcome: string;
  actualOutcome?: string;
  reviewedAt?: number;
  reviewed?: boolean;
}

export interface Session {
  id: string;
  userId: string;
  title: string;
  question: string;
  status: SessionStatus;
  createdAt: number;
  completedAt?: number;
  fullContext?: string;
  documentTexts?: string;
  fileUrls: string[];
  attachedFiles?: { name: string, url: string }[];
  selectedAdvisors?: string[];
  decisions?: Decision[];
  participants?: string[];
}

export interface Invitation {
  id: string;
  sessionId: string;
  invitedBy: string;
  invitedUserId?: string;
  invitedEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

export interface SessionMessage {
  id?: string;
  sessionId: string;
  userId: string;
  role: MessageRole;
  content: string;
  order: number;
  timestamp: number;
}

export interface CouncilResult {
  id?: string;
  sessionId: string;
  userId: string;
  chairmanVerdict: string;
  peerReview: string;
  advisors: Record<string, string>;
}
