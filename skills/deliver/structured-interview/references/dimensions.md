These are the dimensions that sink Microsoft agent projects. They are rarely the functional requirements. Fold them into the interview as branches when they become relevant, and treat the "worry" signals as a reason to dig rather than a reason to stop.

## Surface

**Ask:** which Microsoft surface is this being built on, and what made you rule out the neighbouring one?

Worry when the answer is a surface chosen because it is familiar, because a licence already exists, or because a demo was impressive. Worry when nobody can say what the alternative would have been. If the user cannot articulate the rejected option, the choice has not been made yet, it has been defaulted into.

If the surface is genuinely open, stop the interview and invoke the `which-surface` skill, then come back.

## Operator

**Ask:** who owns this once it is live, and what happens when it behaves oddly at 09:00 on a Monday?

Worry when the builder and the operator are different people and have never spoken. Worry when a business team is going to own something that needs a developer to change. The maintainability ceiling of an agent is set by whoever inherits it, not by whoever builds it.

## Identity

**Ask:** when the agent acts, whose permissions is it using, and what can it reach with them?

Worry about an agent running as a single high-privilege account "for now". Worry when nobody can say whether it acts as the calling user or as itself, because that answer decides the entire security model and is expensive to reverse. Worry when knowledge sources are broader than the narrowest user who can invoke the agent, because that is how an agent becomes an oversharing engine.

## Licensing and cost

**Ask:** what does running this consume, who is billed, and is every intended user licensed for it?

Worry when nobody has checked whether the user population holds the licence the design assumes. Worry when consumption is unbounded and nobody has modelled a bad month. This is the most common late-stage surprise on Microsoft agent projects, because it surfaces at rollout, when the design is already fixed.

## Environments and ALM

**Ask:** where is this built, how does it reach production, and who is allowed to push?

Worry about building in production, which is the default unless someone decided otherwise. Worry when there is no story for moving the thing between environments, when configuration is typed into each environment by hand, or when the answer involves one person and their personal connection.

## Data

**Ask:** what data does this touch, where does it physically live, and what must never leave a boundary?

Worry when nobody has named the regulated data. Worry when data residency has been assumed rather than checked against the regions the service actually runs in. Worry when the answer to "what gets sent to the model" is unclear.

## Governance

**Ask:** who has to approve this before it can exist, and have they been asked yet?

Worry when approval will be sought after the build. Worry when nobody knows whether tenant policy already blocks a connector the design depends on. Finding out at go-live that a required connector is blocked is a project-level failure that a five-minute question prevents.

## Done

**Ask:** what observable thing will prove this works, and who decides it is good enough?

Worry about "the agent answers questions well". That cannot be tested, so it will not be tested. Push until there is something countable: a task the agent completes end to end, a set of questions with expected answers, a measurable reduction in something. If quality cannot be described, it cannot be evaluated, and the project has no exit criterion.
