# NEXUS Development Hub

Central guide for developing, reviewing, and deploying NEXUS OS.

## 1. Source of Truth

| System | Purpose |
|--------|---------|
| **GitHub Projects** | Main task board and workflow management |
| **GitHub Issues** | Track work items, feature requests, bugs |
| **Pull Requests** | Track code changes and reviews |
| **Vercel** | Production deployments and preview URLs |
| **Architecture Docs** | `/docs/` - system design and decisions |

All work originates from GitHub Projects. Issues drive PRs. PRs drive deployments.

## 2. Workflow Columns

NEXUS development uses these GitHub Project columns:

1. **Backlog** - Ideas, future work, not yet committed
2. **Ready** - Approved and ready to work on
3. **In Progress** - Currently being developed
4. **In Review** - PR open, awaiting approval
5. **Blocked** - Waiting on dependency, approval, or clarification
6. **Done** - Merged and deployed

All work must pass through each stage in order.

## 3. Work Item Template

Every GitHub Issue must include these sections:

### Work Item Template

```
### Feature
[Feature name and brief description]

### Module
[Which area: Booking, Customer, Merchant, Tracking, Document, Billing, etc.]

### Goal
[What are we trying to achieve and why?]

### User
[Who benefits: Merchant, Customer, Admin, Driver, Partner?]

### Prompt
[Exact prompt(s) given to the agent, if applicable]

### Files Likely Affected
- src/app/portal/[path]
- src/components/[component]
- src/lib/[utility]
- docs/[doc]

### Do Not Touch
- Database schema (unless explicitly approved)
- Package files (package.json, package-lock.json)
- Environment variables
- External service integrations

### Success Criteria
- [ ] Feature implemented as specified
- [ ] No breaking changes to existing features
- [ ] All new routes/pages respond without errors
- [ ] Terminology consistent with NEXUS hierarchy
- [ ] No console errors or warnings
- [ ] Mobile responsive (iPad-friendly)

### Test Steps
1. [Step 1]
2. [Step 2]
3. [Verify expected outcome]

### PR
[Link to pull request when created]

### Deployment
- Vercel Preview: [URL]
- Production: [Status - pending/live/rolled back]

### Status
- [ ] Architecture approved
- [ ] Prompt approved
- [ ] PR created
- [ ] Build passed
- [ ] Preview reviewed
- [ ] Merged
- [ ] Production checked
```

## 4. Agent Rules

All agents working on NEXUS must follow these rules:

### Architecture & Design
- ❌ **Do not invent architecture.** Only implement from approved prompts.
- ✅ **One agent task = one GitHub issue/card.** No scope creep across cards.
- ✅ **Show changed files before applying.** User must confirm changes.

### Code & Build
- ✅ **Must run `npm run build`** before final commit.
- ✅ **Must run `npm run lint`** and fix any errors.
- ✅ **Must show changed files and diff stats** in PR description.

### Protected Areas
- ❌ **Do not modify Supabase schema** unless explicitly approved in the issue.
- ❌ **Do not modify package.json or package-lock.json** without approval.
- ❌ **Do not modify environment configuration** without approval.
- ❌ **Do not add external dependencies** without approval.

### Security & Quality
- ✅ **Run secret scan** on all changed files.
- ✅ **Run CodeQL** for security analysis.
- ✅ **Ensure no console errors** in dev/production builds.

## 5. Review Gates

All PRs must pass these gates in sequence:

| Gate | Owner | Approval |
|------|-------|----------|
| **Architecture Approved** | Tech Lead | Design review before work starts |
| **Prompt Approved** | Tech Lead | Agent task clearly defined |
| **PR Created** | Agent | Code changes submitted with description |
| **Build Passed** | CI | `npm run build` succeeds, no errors |
| **Preview Reviewed** | Stakeholder | Vercel preview URL tested |
| **Merged** | Tech Lead | Approved and merged to main |
| **Production Checked** | Tech Lead | Vercel deployment verified live |

Do not skip gates. Gate failures block merge.

## 6. Current Priority

### NEXUS Booking Workflow (Phase 1)

Core booking features in priority order:

1. **Upload Document**
   - Merchant uploads delivery document (PDF, manifest, order)
   - System stores file with metadata
   - Status: [On Roadmap]

2. **Process Document**
   - Automatic or manual parsing of booking data
   - Extract recipient, delivery address, weight, special instructions
   - Status: [On Roadmap]

3. **Review Booking**
   - Merchant reviews parsed booking data
   - Edit details if needed
   - Verify addresses, costs, requirements
   - Status: [On Roadmap]

4. **Submit Booking**
   - Create booking record linked to merchant
   - Generate booking reference/ID
   - Send confirmation to merchant
   - Status: [On Roadmap]

5. **Transport Planning & Track-POD Sync**
   - Route planning is a core part of the booking workflow
   - Use booking data to determine collection, delivery, vehicle, service level and route requirements
   - Check whether an existing Track-POD route can be used
   - Create/update Track-POD jobs when booking is accepted
   - Store Track-POD order IDs, route IDs and tracking links
   - Status: [Core Dependency]

6. **POD & Branded Documents**
   - Receive POD evidence from Track-POD
   - Store photos, signatures, timestamps and driver notes
   - Generate merchant-branded POD
   - Store completed documents in the Digital Job Folder
   - Status: [Core Dependency]

### Not in Phase 1
- Customer module (placeholder exists)
- Billing module (placeholder exists)
- Reports module (placeholder exists)
- Settings module (placeholder exists)

## 7. Development Workflow

### Starting New Work

1. **Create GitHub Issue** with Work Item Template
2. **Add to GitHub Project** board in "Ready" column
3. **Describe prompt** clearly for agent
4. **Get architecture approval** if new routes/components
5. **Move card to "In Progress"** when starting work

### During Development

1. **Run agent task** with approved prompt
2. **Agent shows changed files** - you confirm
3. **Agent creates PR** with linked issue
4. **PR passes all gates** (build, lint, security)
5. **Stakeholder reviews** Vercel preview
6. **Move card to "In Review"** when PR is live

### After Merge

1. **Merge PR** to main
2. **Move card to "Done"** in project
3. **Monitor Vercel** deployment (usually auto)
4. **Test production** at live URL
5. **Update Status** in issue with production URL

## 8. Terminal Commands

### Local Development
```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Run build
npm run build

# Start dev server (local only, not in agent)
npm run dev
```

### Verify Before Committing
```bash
npm run lint    # Fix any errors
npm run build   # Ensure production build works
git status      # Review changed files
git diff        # Review line-by-line changes
```

## 9. Communication

### For Agents
- **Always show changed files before applying**
- **Always provide diff statistics**
- **Link back to GitHub Issue**
- **Report progress in PR description**

### For Reviewers
- **Approve architecture before work starts**
- **Test Vercel preview before merging**
- **Verify production deployment is live**
- **Document any issues in GitHub Issues**

---

**Last Updated:** 2026-06-26  
**Owner:** nexus-delivery/nexus-intake maintainers
