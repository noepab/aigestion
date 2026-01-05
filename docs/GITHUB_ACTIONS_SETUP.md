# GitHub Actions Setup for AI Evaluation

This guide explains how to enable automated AI quality evaluation in your CI/CD pipeline.

## 🚀 Quick Setup

### 1. Configure Repository Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret Name      | Description                              | Required |
| ---------------- | ---------------------------------------- | -------- |
| `GEMINI_API_KEY` | Google Gemini API key                    | ✅ Yes    |
| `MONGODB_URI`    | MongoDB connection string                | ✅ Yes    |
| `JWT_SECRET`     | JWT secret for authentication            | ✅ Yes    |
| `GITHUB_TOKEN`   | Automatically provided by GitHub Actions | ✅ Auto   |

### 2. Enable Workflows

The following workflows are now available:

#### 📊 **ai-evaluation.yml** - PR Quality Checks
- **Trigger:** Every pull request to `main`
- **Purpose:** Evaluate AI response quality before merging
- **Cost:** FREE (uses GitHub Models)
- **Duration:** ~2-3 minutes

**What it does:**
1. Starts NEXUS V1 server
2. Collects responses from Gemini API
3. Evaluates with GPT-4o (GitHub Models)
4. Checks quality thresholds
5. Comments results on PR

#### 📅 **ai-monitoring.yml** - Weekly Quality Monitoring
- **Trigger:** Every Monday at 9:00 AM UTC
- **Purpose:** Track AI quality trends over time
- **Cost:** FREE (uses GitHub Models)
- **Duration:** ~2-3 minutes

**What it does:**
1. Runs full evaluation suite
2. Checks quality thresholds
3. Creates issue if quality degraded
4. Archives results for 90 days

## 📋 Workflow Details

### ai-evaluation.yml (PR Checks)

```yaml
Triggers:
  - Pull requests to main
  - Changes to server/src/** or test_dataset.jsonl
  - Manual dispatch

Steps:
  1. Setup Python 3.11 + Node.js 20
  2. Install dependencies
  3. Start NEXUS V1 server with secrets
  4. Collect AI responses (collect_responses.py)
  5. Run evaluation (evaluate_gemini_github.py)
  6. Check thresholds (check_thresholds.py)
  7. Upload artifacts
  8. Comment results on PR
```

**Example PR Comment:**
```markdown
## 🤖 AI Quality Evaluation Results

**Model:** gpt-4o
**Total Evaluated:** 8 responses

### 📊 Average Scores

| Metric    | Score  | Status |
| --------- | ------ | ------ |
| Coherence | 4.75/5 | ✅      |
| Fluency   | 4.88/5 | ✅      |
| Relevance | 4.62/5 | ✅      |

**Overall:** ✅ PASSED

💰 **Cost:** FREE (GitHub Models)
```

### ai-monitoring.yml (Weekly Monitoring)

```yaml
Triggers:
  - Cron: Every Monday 9:00 AM UTC
  - Manual dispatch

Steps:
  1-6: Same as ai-evaluation.yml
  7. Upload artifacts (90-day retention)
  8. Create issue if quality < threshold
  9. Optional: Send email notification
```

**Example Issue Created:**
```markdown
⚠️ AI Quality Alert: Evaluation thresholds not met

## Weekly AI Quality Evaluation Failed

### Scores
| Metric    | Score  | Threshold | Status |
| --------- | ------ | --------- | ------ |
| Coherence | 3.75/5 | 4.0       | ❌      |
| Fluency   | 4.25/5 | 4.0       | ✅      |
| Relevance | 3.88/5 | 4.0       | ❌      |

### Recommended Actions
1. Review recent changes to Gemini API integration
2. Check if prompt templates have been modified
...
```

## 🎯 Quality Thresholds

Default thresholds (configured in `check_thresholds.py`):

```python
THRESHOLDS = {
    "coherence": 4.0,    # Minimum average coherence
    "fluency": 4.0,      # Minimum average fluency
    "relevance": 4.0     # Minimum average relevance
}
```

To modify thresholds, edit `evaluation/NEXUS V1/check_thresholds.py`.

## 🔧 Customization

### Change Evaluation Frequency

Edit `.github/workflows/ai-monitoring.yml`:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
    # Examples:
    # - cron: '0 */6 * * *'   # Every 6 hours
    # - cron: '0 0 * * *'     # Daily at midnight
    # - cron: '0 9 * * 0,3'   # Sunday and Wednesday at 9 AM
```

### Use AWS Bedrock Instead

Replace `evaluate_gemini_github.py` with `evaluate_gemini_aws.py`:

```yaml
- name: Run evaluation (AWS Bedrock)
  working-directory: evaluation/NEXUS V1
  env:
    AWS_REGION: us-east-1
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: python evaluate_gemini_aws.py
```

Add secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### Use Azure OpenAI

```yaml
- name: Run evaluation (Azure OpenAI)
  working-directory: evaluation/NEXUS V1
  env:
    AZURE_OPENAI_ENDPOINT: ${{ secrets.AZURE_OPENAI_ENDPOINT }}
    AZURE_OPENAI_KEY: ${{ secrets.AZURE_OPENAI_KEY }}
    AZURE_OPENAI_DEPLOYMENT: gpt-4
  run: python evaluate_gemini.py
```

Add secrets: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`

## 📊 Viewing Results

### In Pull Requests
Results appear automatically as a comment on every PR.

### In Actions Tab
1. Go to **Actions** tab
2. Click on workflow run
3. Download **evaluation-results** artifact
4. Extract and view `evaluation_results.json`

### Weekly Monitoring
1. Issues created automatically when quality drops
2. Artifacts stored for 90 days in Actions tab
3. Label: `ai-quality`, `automated-alert`

## 🚨 Troubleshooting

### Workflow fails: "GEMINI_API_KEY not set"
**Solution:** Add `GEMINI_API_KEY` to repository secrets.

### Workflow fails: "Rate limit exceeded (429)"
**Solution:**
- GitHub Models has rate limits
- Switch to AWS Bedrock or Azure OpenAI
- Add delays in `evaluate_gemini_github.py`

### Workflow fails: "Server not responding"
**Solution:**
- Increase `sleep` time in workflow (default: 30s)
- Check `MONGODB_URI` is correct
- Verify `JWT_SECRET` is set

### No PR comment appears
**Solution:**
- Check workflow has `pull_request` trigger
- Verify `GITHUB_TOKEN` permissions
- Review Actions logs for errors

## 💡 Best Practices

1. **Start with PR checks only** - Enable `ai-evaluation.yml` first
2. **Monitor costs** - GitHub Models is free but has rate limits
3. **Review thresholds** - Adjust based on your quality requirements
4. **Archive results** - Keep historical data for trend analysis
5. **Alert fatigue** - Don't set thresholds too high initially

## 📈 Next Steps

Once workflows are running:

1. **Baseline:** Run evaluation on `main` branch to establish baseline
2. **Trends:** Track scores over time (weekly artifacts)
3. **Iterate:** Adjust thresholds based on actual performance
4. **Expand:** Add more test queries to `test_dataset.jsonl`
5. **Integrate:** Use results in code review process

## 🔗 Related Documentation

- [CI_CD_INTEGRATION.md](../../evaluation/NEXUS V1/CI_CD_INTEGRATION.md) - Detailed CI/CD guide
- [API_KEYS_SETUP_GUIDE.md](../../API_KEYS_SETUP_GUIDE.md) - API credentials setup
- [evaluation/NEXUS V1/README.md](../../evaluation/NEXUS V1/README.md) - Evaluation framework docs

---

**Questions?** Open an issue with label `ai-evaluation`

