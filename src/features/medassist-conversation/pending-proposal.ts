import type { Proposal } from './natural';

export type ProposalSource = { requestId: string; proposal: Proposal };
export type PendingProposal = { sources: ProposalSource[]; alternative?: ProposalSource };

export function reviewProposal(current: PendingProposal | null, incoming: ProposalSource): PendingProposal | null {
  if (!incoming.proposal.observations.length || incoming.proposal.instruction_attempt || current?.alternative)
    return current;
  const sources = current?.sources ?? [];
  const existing = sources.flatMap(source => source.proposal.observations);
  const additions: Proposal['observations'] = [];
  for (const item of incoming.proposal.observations) {
    const prior = existing.find(observation => observation.evidence_id === item.evidence_id);
    if (!prior) additions.push(item);
    else if (prior.state !== item.state || JSON.stringify(prior.value) !== JSON.stringify(item.value))
      return { sources, alternative: incoming };
  }
  if (!additions.length) return current;
  return { sources: [...sources, { ...incoming, proposal: { ...incoming.proposal, observations: additions } }] };
}
