const DAY = 24 * 60 * 60 * 1000;

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function gradeFor(score) {
  if (score >= 85) return { grade: 'Excellent', tone: 'excellent' };
  if (score >= 70) return { grade: 'Good', tone: 'good' };
  if (score >= 50) return { grade: 'Fair', tone: 'fair' };
  return { grade: 'Needs attention', tone: 'poor' };
}

/**
 * GitStats health score (0-100)
 *
 *   35 pts  commit activity   volume + consistency over the last 30 days
 *   35 pts  issue response    median time to close recently closed issues
 *   30 pts  pull requests     merge rate of recently closed PRs
 *
 * Components with no recent data receive neutral half-credit so a quiet but
 * healthy repository is not punished as if it were abandoned.
 */
export function calculateHealth({
  commits30d = 0,
  activeDays = 0,
  medianCloseDays = null,
  mergedPRs = 0,
  closedPRs = 0,
  issueSample = 0,
  prCapped = false
} = {}) {
  const commitPoints = roundOne(
    clamp(20 * Math.min(1, commits30d / 40) + 15 * Math.min(1, activeDays / 15), 0, 35)
  );

  const hasIssueData = medianCloseDays !== null && Number.isFinite(medianCloseDays);
  const issuePoints = hasIssueData
    ? roundOne(clamp(35 * (1 - Math.log10(1 + medianCloseDays) / Math.log10(31)), 0, 35))
    : 17.5;

  const hasPullData = closedPRs > 0;
  const prPoints = hasPullData ? roundOne(clamp(30 * (mergedPRs / closedPRs), 0, 30)) : 15;

  const score = Math.round(clamp(commitPoints + issuePoints + prPoints, 0, 100));
  const { grade, tone } = gradeFor(score);

  const formatDays = (days) => {
    if (days === null) return 'no recent data';
    if (days < 1) return 'under a day';
    if (days < 30) {
      const rounded = Math.round(days);
      return `${rounded} ${rounded === 1 ? 'day' : 'days'}`;
    }
    return `${(days / 30.44).toFixed(1)} months`;
  };

  return {
    score,
    grade,
    tone,
    breakdown: [
      {
        key: 'commits',
        label: 'Commit activity',
        points: commitPoints,
        max: 35,
        detail: `${commits30d}${commits30d >= 100 ? '+' : ''} commits on ${activeDays} active ${activeDays === 1 ? 'day' : 'days'} in the last 30 days.`
      },
      {
        key: 'issues',
        label: 'Issue responsiveness',
        points: issuePoints,
        max: 35,
        detail: hasIssueData
          ? `Median close time of ${formatDays(medianCloseDays)} across ${issueSample} recently closed ${issueSample === 1 ? 'issue' : 'issues'}.`
          : 'No recently closed issues to sample, so a neutral score is applied.'
      },
      {
        key: 'pulls',
        label: 'Pull request flow',
        points: prPoints,
        max: 30,
        detail: hasPullData
          ? `${mergedPRs} of ${closedPRs} recently closed pull requests merged${prCapped ? ' (latest 100 sampled)' : ''}.`
          : 'No recently closed pull requests to sample, so a neutral score is applied.'
      }
    ]
  };
}

export { DAY };
