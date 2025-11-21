---
title: Legal and compliance
---

# Legal and compliance

> Legal agreements, compliance information, and security details for Grok One-Shot.

## Legal agreements

### License

Grok One-Shot is open-source software licensed under the MIT License.

Your use of Grok One-Shot is subject to:

- **Grok One-Shot**: MIT License (see repository LICENSE file)
- **xAI Grok API**: [xAI Terms of Service](https://x.ai/legal/terms-of-service)

> **Parity Gap**: Unlike Claude Code which has formal Commercial Terms (Team, Enterprise, API) and Consumer Terms (Free, Pro, Max), Grok One-Shot is a third-party open-source CLI tool governed by:
>
> 1. MIT License for the CLI tool itself
> 2. xAI's API terms for API usage

### Commercial agreements

**Claude Code approach**:

- Commercial Terms apply to Team, Enterprise, and Claude API users
- Consumer Terms apply to Free, Pro, and Max users
- Whether using 1P (Anthropic) or 3P (Bedrock/Vertex), existing commercial agreements apply

**Grok One-Shot approach**:

- MIT License for CLI tool (permissive, commercial-friendly)
- xAI API terms apply uniformly to all API users
- No first-party vs third-party distinction (xAI API only)
- No tiered commercial agreements within Grok One-Shot

When using Grok One-Shot, you are making API calls to xAI using your own API key. Your usage is governed by:

- [xAI API Terms of Service](https://x.ai/legal/terms-of-service)
- [xAI Privacy Policy](https://x.ai/legal/privacy-policy)
- Any commercial agreements you have with xAI (if applicable)

## Compliance

### Healthcare compliance (BAA)

**Claude Code**:

- BAA available for customers with Zero Data Retention (ZDR)
- Automatically extends to Claude Code usage
- Applicable to Team/Enterprise with BAA + ZDR

**Grok One-Shot**:

- xAI does not currently offer Business Associate Agreements (BAA) for HIPAA compliance
- No Zero Data Retention (ZDR) option
- Not suitable for PHI without explicit xAI agreement

> **Parity Gap**: Critical compliance gap for healthcare use cases.

**If you require HIPAA compliance**:

1. Contact xAI directly about enterprise agreements
2. Verify if BAA and ZDR options are available
3. Do not process PHI through Grok One-Shot without proper legal agreements
4. Consider alternative solutions with BAA support (like Claude Code)

### Enterprise compliance certifications

> **Parity Gap**: Grok One-Shot does not have formal enterprise compliance certifications. For enterprise use cases requiring SOC 2, ISO 27001, or other certifications, review xAI's compliance status directly.

**Claude Code certifications**:

- SOC 2 Type II (via Anthropic Trust Center)
- Various compliance artifacts available
- Trust Center: [trust.anthropic.com](https://trust.anthropic.com)

**Grok One-Shot status**:

- Open-source project (no formal certifications for CLI)
- xAI API compliance varies
- Recommend reviewing xAI's compliance documentation

**Recommendations for enterprise use**:

1. Review xAI's security and compliance documentation
2. Conduct your own security assessment of Grok One-Shot codebase
3. Implement network controls (API proxies, logging) if needed
4. Use internal forks if additional controls are required
5. Keep Grok One-Shot updated to latest version

## Security and trust

### Trust and safety

**Claude Code**:

- [Anthropic Trust Center](https://trust.anthropic.com)
- [Transparency Hub](https://www.anthropic.com/transparency)
- Comprehensive compliance artifacts
- SOC 2 Type II reports

**Grok One-Shot**:

- Open-source codebase (full transparency)
- No centralized trust center
- xAI security documentation: [x.ai/legal/security](https://x.ai/legal/security)
- Community security reviews via GitHub

> **Parity Gap**: No formal trust center or compliance artifact repository. Open-source transparency provides different security model.

### Security vulnerability reporting

**Claude Code**:

- Managed through HackerOne
- Formal bug bounty program
- Coordinated disclosure process
- [Report vulnerabilities](https://hackerone.com/anthropic-vdp/reports/new?type=team&report_type=vulnerability)

**Grok One-Shot**:

- Report via GitHub Security Advisories
- Or email maintainers (see repository)
- Community-driven coordinated disclosure
- No formal bug bounty program

**For xAI/Grok API vulnerabilities**:

- Report to xAI's security team
- Follow xAI's responsible disclosure policy

### Open-source security benefits

**Transparency advantages**:

- Full source code available on GitHub
- No obfuscation or hidden functionality
- Community review and contributions welcome
- Dependencies auditable via `package.json`

**Security features**:

- API key stored locally (not transmitted except to xAI)
- No third-party telemetry or tracking
- Local-only execution (no cloud components)
- TLS encryption for API communication
- No external dependencies for core functionality

**Security considerations**:

- Session files contain full conversation history (stored locally)
- API key stored in plaintext in `~/.grok/settings.json` (use `chmod 600`)
- File system access as broad as your user permissions
- Bash command execution capabilities (by design)

## Data handling

### Data policies comparison

| Aspect                          | Claude Code       | Grok One-Shot   |
| ------------------------------- | ----------------- | --------------- |
| **Training opt-out**            | Consumer control  | API-level only  |
| **Commercial no-train**         | Default           | Per xAI policy  |
| **Development Partner Program** | Opt-in            | Not available   |
| **Data retention tiers**        | 5yr/30d/ZDR       | Per xAI policy  |
| **Local session storage**       | Configurable      | Manual cleanup  |
| **Telemetry**                   | Opt-out available | Not implemented |

### What Grok One-Shot accesses

By design, Grok One-Shot can:

- Read any file your user account can read
- Write/edit any file your user account can write
- Execute bash commands with your user privileges
- Send file contents and code to xAI API as context

**Security best practices**:

1. Run Grok One-Shot with appropriate user permissions (not root)
2. Use `.grokignore` or `.gitignore` to exclude sensitive files
3. Review prompts before confirming operations
4. Keep API keys secure and rotated regularly
5. Monitor `~/.grok/sessions/` for sensitive data

### What gets sent to xAI

When using Grok One-Shot, the following data is sent to xAI's API:

- Your prompts and messages
- Code and file contents you reference
- Tool execution results (file contents, command outputs)
- Conversation history for context

**Data minimization tips**:

1. Be selective about which files you ask Grok One-Shot to read
2. Avoid including credentials or secrets in prompts
3. Use environment variables instead of hardcoded secrets
4. Review session files before sharing for bug reports

## Compliance certifications

> **Parity Gap**: Grok One-Shot is an open-source community project without formal compliance certifications. For regulated industries, conduct your own assessment.

### Currently unavailable

**Formal certifications**:

- SOC 2 Type II certification
- ISO 27001 certification
- HIPAA BAA
- FedRAMP authorization
- GDPR Data Processing Agreement (DPA)
- PCI-DSS certification

**Why these are unavailable**:

- Grok One-Shot is an open-source CLI tool, not a SaaS service
- Certifications apply to xAI's API infrastructure
- Users should review xAI's compliance directly

### For compliance needs

**Steps for regulated industries**:

1. Review xAI's compliance status for the API layer
2. Conduct your own risk assessment of Grok One-Shot
3. Implement additional controls as needed:

- API proxies for logging and monitoring
- Network-level security controls
- Audit trails and access controls

4. Consider forking and adding required controls
5. Consult with your compliance team before production use

### GDPR (Europe)

**User rights**:

- **Right to access**: View your local session files in `~/.grok/`
- **Right to deletion**: Delete `~/.grok/` directory; contact xAI for API data
- **Right to portability**: Session files are JSON (portable format)
- **Right to object**: Stop using the service at any time

**Data controller roles**:

- **Local data**: You (the user)
- **API data**: xAI (data processor)

### CCPA (California)

**Consumer rights**:

- Right to know what data is collected
- Right to deletion
- Right to opt-out of "sales" (not applicable - no data sales)
- Right to non-discrimination

**Compliance**:

- Grok One-Shot does not "sell" data
- Local data under your control
- API data governed by xAI's CCPA compliance

### HIPAA (Healthcare)

** Critical warning**:

- **Do NOT use Grok One-Shot with PHI (Protected Health Information)** without ensuring xAI has appropriate BAA
- Default configuration is **NOT HIPAA-compliant**
- Consult legal counsel before using with healthcare data

### PCI-DSS (Payment Card Industry)

** Important**:

- **Do NOT use Grok One-Shot with payment card data (PAN, CVV, etc.)**
- Not designed for PCI-DSS compliance
- Use specialized PCI-compliant tools instead

## License and attribution

**Grok One-Shot**:

- License: MIT License
- Copyright: See repository LICENSE file
- Attribution: Required per MIT License terms

**Third-party dependencies**:

- See `package.json` for full dependency list
- Each dependency has its own license (mostly MIT/BSD)
- Use `bun install` to review dependency licenses

**xAI Trademarks**:

- "Grok" is a trademark of xAI
- This project is not officially affiliated with or endorsed by xAI
- Use of xAI's API is subject to their terms

## Terms of use

By using Grok One-Shot, you agree to:

1. Comply with the MIT License
2. Comply with xAI's Terms of Service when using their API
3. Use the tool responsibly and ethically
4. Not use it for illegal or harmful purposes
5. Respect the privacy and security of others

## Liability and warranty

**MIT License disclaimer**:

```
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

**Use at your own risk**:

- No warranties or guarantees provided
- No liability for data loss, security issues, or other damages
- You are responsible for securing your API keys and data
- You are responsible for compliance with applicable laws and regulations

## Parity summary

### Major gaps vs Claude Code

| Feature             | Impact                         | Mitigation                            |
| ------------------- | ------------------------------ | ------------------------------------- |
| **No BAA/HIPAA**    | Cannot use with PHI            | Contact xAI for enterprise agreements |
| **No ZDR**          | No zero data retention         | Review xAI retention policy           |
| **No tiered terms** | No commercial/consumer split   | Uniform API terms                     |
| **No trust center** | No centralized compliance docs | Open-source transparency              |
| **No bug bounty**   | Informal security reporting    | GitHub Security Advisories            |
| **No formal certs** | No SOC2/ISO27001 for CLI       | Review xAI API compliance             |

### Advantages of open-source model

**Benefits**:

- Full code transparency (no hidden behavior)
- Community security review
- No vendor lock-in
- Free to fork and customize
- No telemetry or tracking

## Contact and resources

**For Grok One-Shot**:

- GitHub Issues: Report bugs and feature requests
- GitHub Discussions: Community support
- Documentation: `.agent/docs/` directory

**For xAI/Grok API**:

- [xAI Support](https://x.ai/support)
- [xAI Legal](mailto:legal@x.ai)
- API documentation: [x.ai/api](https://x.ai/api)

**Compliance resources**:

- [Data Usage Guide](../administration/data-usage.md)
- [Settings & Security](../configuration/settings.md)
- [xAI Terms](https://x.ai/legal/terms-of-service)
- [xAI Privacy](https://x.ai/legal/privacy-policy)

---

© 2024-2025 Grok One-Shot Contributors. Open source under MIT License.

Use of xAI's API is subject to [xAI's Terms of Service](https://x.ai/legal/terms-of-service).

**Disclaimer**: This document provides general information and is not legal advice. Consult qualified legal counsel for your specific situation.

**Last updated**: November 7, 2025
**Version**: 1.1.101
