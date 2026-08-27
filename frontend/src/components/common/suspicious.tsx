import React from "react";
import styled from "styled-components";
import { SuspiciousFlag } from "../../types/hero";

/**
 * Warning shown on heroes suspected of being obtained through fraud or a
 * hacked account.
 */

const REASON_LABEL: Record<string, string> = {
  fraud: "Suspected fraud",
  stolen: "Suspected stolen asset",
  laundering: "Suspected laundering",
};

export const suspiciousTitle = (flag: SuspiciousFlag): string =>
  REASON_LABEL[flag.reason] || "Suspicious asset";

export const suspiciousDetail = (flag: SuspiciousFlag): string => {
  if (flag.note) return flag.note;
  return flag.matchedBy === "seller"
    ? "The wallet selling this hero has been reported. Trade at your own risk."
    : "This hero has been reported as possibly obtained from a hacked or fraudulent account. Trade at your own risk.";
};

interface BadgeProps {
  flag?: SuspiciousFlag | null;
}

export const SuspiciousBadge: React.FC<BadgeProps> = ({ flag }) => {
  if (!flag) return null;

  return <Badge title={suspiciousDetail(flag)}>⚠ Suspicious</Badge>;
};

export const SuspiciousBanner: React.FC<BadgeProps> = ({ flag }) => {
  if (!flag) return null;

  return (
    <Banner>
      <div className="title">⚠ {suspiciousTitle(flag)}</div>
      <div className="detail">{suspiciousDetail(flag)}</div>
    </Banner>
  );
};

const Badge = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.33;
  color: #fff;
  padding: 0.313rem 0.375rem;
  border-radius: 3px;
  background-color: #ff0759;
  margin: 0.438rem 0rem;
  width: fit-content;
  white-space: nowrap;
  text-transform: uppercase;
  cursor: help;
`;

const Banner = styled.div`
  border: solid 1px #ff0759;
  background-color: rgba(255, 7, 89, 0.12);
  border-radius: 3px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  .title {
    color: #ff5c8a;
    font-size: 1.125rem;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  .detail {
    color: #d7dbe8;
    font-size: 0.95rem;
    line-height: 1.4;
  }
`;
